import { Novu } from '@novu/node'

const novu = new Novu(process.env.NOVU_API_KEY!)

export async function sendNewsletter(subject: string, content: string, subscribers: string[]) {
  try {
    await novu.trigger('newsletter', {
      to: subscribers.map(email => ({ subscriberId: email, email })),
      payload: {
        subject,
        content,
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending newsletter:', error)
    return { success: false, error }
  }
} 