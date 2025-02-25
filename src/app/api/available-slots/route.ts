import { NextResponse } from 'next/server';
import { getCalendarClient, CALENDAR_ID, TIMEZONE } from '@/utils/googleCalendar';

// Business hours configuration
const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 18,  // 6 PM
  days: [1, 2, 3, 4, 5], // Monday = 1, Friday = 5
};

// Helper function to check if time is within business hours
function isWithinBusinessHours(date: Date): boolean {
  // Convert to Singapore time
  const sgTime = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const day = sgTime.getDay();
  const sgHour = sgTime.getHours();
  
  return (
    BUSINESS_HOURS.days.includes(day) && // Check if it's a weekday
    sgHour >= BUSINESS_HOURS.start &&    // Check if it's after opening time
    sgHour < BUSINESS_HOURS.end         // Check if it's before closing time
  );
}

export async function GET() {
  try {
    const calendar = getCalendarClient();
    
    // Get time window for next year
    const startTime = new Date();
    startTime.setMinutes(30 * Math.floor(startTime.getMinutes() / 30));
    startTime.setSeconds(0);
    startTime.setMilliseconds(0);

    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 365); // Changed from 7 to 365 days
    endTime.setHours(BUSINESS_HOURS.end, 0, 0, 0);

    const freebusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        timeZone: TIMEZONE,
        items: [{ id: CALENDAR_ID }],
      },
    });

    const busy = freebusyResponse.data.calendars?.[CALENDAR_ID]?.busy || [];

    // Generate available 30-minute slots
    let current = new Date(startTime);
    const freeSlots = [];

    while (current < endTime) {
      // If it's within business hours
      if (isWithinBusinessHours(current)) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + 30 * 60000); // 30 minutes

        // Check for conflicts
        const conflicts = busy.some(b => {
          const busyStart = new Date(b.start);
          const busyEnd = new Date(b.end);
          return slotStart < busyEnd && slotEnd > busyStart;
        });

        if (!conflicts) {
          freeSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString()
          });
        }
      }

      // Move to next 30-minute slot
      current = new Date(current.getTime() + 30 * 60000);
      
      // If we've passed today's closing time, move to next day's opening time
      if (current.getHours() >= BUSINESS_HOURS.end) {
        current.setDate(current.getDate() + 1);
        current.setHours(BUSINESS_HOURS.start, 0, 0, 0);
      }
    }

    return NextResponse.json(freeSlots);
  } catch (error) {
    console.error('Error fetching free slots:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 