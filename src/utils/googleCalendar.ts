import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import path from 'path';

// Update these with your actual values
const CALENDAR_ID = process.env.CALENDAR_ID || '';
const TIMEZONE = process.env.TIMEZONE || 'Asia/Singapore';

// Initialize Google Calendar client
const getCalendarClient = () => {
  const keyFile = require('../config/infra-smile-397603-8ed78d6963ee.json');
  
  const auth = new JWT({
    email: keyFile.client_email,
    key: keyFile.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
};

export { getCalendarClient, CALENDAR_ID, TIMEZONE }; 