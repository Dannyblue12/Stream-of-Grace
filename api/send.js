const nodemailer = require("nodemailer")

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Only POST requests allowed",
    })
  }

  try {
    const { name, email, subject, message } = req.body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      })
    }

    // Check environment variables
    const emailUser = process.env.EMAIL_USER
    const emailPass = process.env.EMAIL_PASS

    if (!emailUser || !emailPass) {
      console.error("Missing email credentials")
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      })
    }

    // Create transporter
   const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    // Important for Hostinger
    ciphers: "SSLv3",
    minVersion: "TLSv1.2"
  }
});


    // Send email
    await transporter.sendMail({
      from: `"${name}" <${emailUser}>`,
      replyTo: email,
      to: "info@streamofgracechapel.org",
      subject: `Contact Form: ${subject}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br>${message.replace(/\n/g, "<br>")}</p>
      `,
    })

    return res.status(200).json({
      success: true,
      message: "Message sent successfully!",
    })
  } catch (error) {
    console.error("Email error:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later.",
    })
  }
}
