import { NextResponse } from 'next/server';
import { getCalendarClient, CALENDAR_ID, TIMEZONE } from '@/utils/googleCalendar';

// Business hours configuration
const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 18,  // 6 PM
  days: [1, 2, 3, 4, 5], // Monday = 1, Friday = 5
};

// Helper function to check if time is within business hours and not in the past
function isWithinBusinessHours(date: Date): boolean {
  // Convert to Singapore time
  const sgTime = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const day = sgTime.getDay();
  const sgHour = sgTime.getHours();
  const sgMinutes = sgTime.getMinutes();
  
  // For today, check if the time has passed
  const now = new Date();
  const sgNow = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const isToday = sgTime.toDateString() === sgNow.toDateString();
  
  // If it's today and the time has passed, return false
  if (isToday) {
    if (sgTime < sgNow) {
      return false;
    }
  }

  return (
    BUSINESS_HOURS.days.includes(day) && // Check if it's a weekday
    sgHour >= BUSINESS_HOURS.start &&    // Check if it's after opening time
    sgHour < BUSINESS_HOURS.end         // Check if it's before closing time
  );
}

// Helper function to get free slots for a specific time range
async function getFreeSlotsForRange(calendar: any, startTime: Date, endTime: Date) {
  const freebusyResponse = await calendar.freebusy.query({
    requestBody: {
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      timeZone: TIMEZONE,
      items: [{ id: CALENDAR_ID }],
    },
  });

  const busy = freebusyResponse.data.calendars?.[CALENDAR_ID]?.busy || [];
  const freeSlots = [];
  let current = new Date(startTime);

  while (current < endTime) {
    if (isWithinBusinessHours(current)) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + 30 * 60000);

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

    current = new Date(current.getTime() + 30 * 60000);
    
    if (current.getHours() >= BUSINESS_HOURS.end) {
      current.setDate(current.getDate() + 1);
      current.setHours(BUSINESS_HOURS.start, 0, 0, 0);
    }
  }

  return freeSlots;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    const calendar = getCalendarClient();
    
    // Get time window for the selected date (or default to today)
    const selectedDate = dateParam ? new Date(dateParam) : new Date();
    const startTime = new Date(selectedDate);
    startTime.setHours(BUSINESS_HOURS.start, 0, 0, 0);

    const endTime = new Date(selectedDate);
    endTime.setHours(BUSINESS_HOURS.end, 0, 0, 0);

    // Get free slots for the selected date
    const freeSlots = await getFreeSlotsForRange(calendar, startTime, endTime);

    return NextResponse.json(freeSlots);
  } catch (error) {
    console.error('Error fetching free slots:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 