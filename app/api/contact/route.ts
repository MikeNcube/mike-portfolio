import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const MAX_FIELD_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;

// Simple in-memory rate limiter: 5 submissions per IP per hour.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const submissionLog = new Map<string, number[]>();

// Returns true if this IP is within its submission budget.
function withinRateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (submissionLog.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  submissionLog.set(ip, recent);
  return true;
}

// Escapes user input before it is interpolated into the notification email.
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'The contact form is not configured. Please email mikencube03@gmail.com directly.' },
      { status: 503 },
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!withinRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 },
    );
  }

  let name = '';
  let email = '';
  let message = '';
  try {
    const body = await req.json();
    name = typeof body.name === 'string' ? body.name.trim() : '';
    email = typeof body.email === 'string' ? body.email.trim() : '';
    message = typeof body.message === 'string' ? body.message.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are all required.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  name = name.slice(0, MAX_FIELD_LENGTH);
  email = email.slice(0, MAX_FIELD_LENGTH);
  message = message.slice(0, MAX_MESSAGE_LENGTH);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>',
      to: process.env.CONTACT_TO_EMAIL || 'mikencube03@gmail.com',
      replyTo: email,
      subject: `Portfolio message from ${name}`,
      html: [
        `<p><b>Name:</b> ${escapeHtml(name)}</p>`,
        `<p><b>Email:</b> ${escapeHtml(email)}</p>`,
        `<p><b>Message:</b></p>`,
        `<p>${escapeHtml(message).replaceAll('\n', '<br/>')}</p>`,
      ].join(''),
    });
    if (error) {
      console.error('Resend rejected the email:', error);
      return NextResponse.json(
        { error: 'The message could not be sent. Please email mikencube03@gmail.com directly.' },
        { status: 502 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('contact route failed:', err);
    return NextResponse.json(
      { error: 'The message could not be sent. Please email mikencube03@gmail.com directly.' },
      { status: 502 },
    );
  }
}
