import { NextRequest, NextResponse } from 'next/server';
import { getCalendarClient, CALENDAR_ID, TIMEZONE } from '@/utils/googleCalendar';
import { AppointmentFormData } from '@/types/appointment';

export async function POST(request: NextRequest) {
  try {
    const data: AppointmentFormData = await request.json();
    const { name, email, phone, service, start, end } = data;

    if (!name || !email || !phone || !service || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const calendar = getCalendarClient();

    const event = {
      summary: `${service} - Appointment with ${name}`,
      description: `Service: ${service}\nContact: ${phone}\nEmail: ${email}${
        data.message ? `\nMessage: ${data.message}` : ''
      }`,
      start: {
        dateTime: start,
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: end,
        timeZone: TIMEZONE,
      },
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    });

    return NextResponse.json({
      message: 'Appointment booked successfully',
      eventId: response.data.id
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 