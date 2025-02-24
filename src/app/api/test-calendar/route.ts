import { NextResponse } from 'next/server';
import { getCalendarClient, CALENDAR_ID, TIMEZONE } from '@/utils/googleCalendar';

export async function GET() {
  try {
    const calendar = getCalendarClient();
    
    // Get today's events
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return NextResponse.json({
      calendarId: CALENDAR_ID,
      events: response.data.items
    });
  } catch (error) {
    console.error('Error testing calendar:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 