import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required', success: false },
        { status: 400 }
      );
    }

    // Check if Twilio is configured
    if (!client || !accountSid || !authToken || !twilioPhoneNumber) {
      console.log('Twilio not configured - using development mode');
      return NextResponse.json(
        { 
          error: 'Twilio not configured', 
          success: false,
          developmentMode: true,
          message: 'Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in environment variables'
        },
        { status: 400 }
      );
    }

    console.log('Sending SMS via Twilio to:', phoneNumber);

    // Send SMS via Twilio
    const twilioMessage = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log('Twilio SMS sent successfully');
    console.log('Message SID:', twilioMessage.sid);
    console.log('Status:', twilioMessage.status);

    return NextResponse.json({
      success: true,
      messageSid: twilioMessage.sid,
      status: twilioMessage.status,
      message: 'SMS sent successfully via Twilio'
    });

  } catch (error: any) {
    console.error('Twilio SMS error:', error);
    
    // Return error but allow fallback
    return NextResponse.json(
      { 
        error: error.message || 'Failed to send SMS',
        success: false,
        twilioError: true
      },
      { status: 500 }
    );
  }
}