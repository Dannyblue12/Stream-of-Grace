const nodemailer = require("nodemailer")

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

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

    // Check if environment variables are available
    const emailUser = process.env.EMAIL_USER
    const emailPass = process.env.EMAIL_PASS

    if (!emailUser || !emailPass) {
      console.error("Missing email credentials in environment variables")
      return res.status(500).json({
        success: false,
        message: "Server configuration error. Please contact support.",
      })
    }

    console.log("Creating transporter with:", {
      host: "smtp.hostinger.com",
      port: 587,
      user: emailUser,
    })

    const transporter = nodemailer.createTransporter({
      host: "smtp.hostinger.com",
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Verify transporter configuration
    await transporter.verify()
    console.log("Transporter verified successfully")

    const mailOptions = {
      from: `"${name}" <${emailUser}>`, // Use your authenticated email as sender
      replyTo: email, // Set reply-to as the form submitter's email
      to: "info@streamofgracechapel.org",
      subject: `Contact Form: ${subject}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br>${message.replace(/\n/g, "<br>")}</p>
      `,
    }

    console.log("Sending email with options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    })

    await transporter.sendMail(mailOptions)
    console.log("Email sent successfully")

    return res.status(200).json({
      success: true,
      message: "Message sent successfully!",
    })
  } catch (error) {
    console.error("Detailed error:", {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack,
    })

    // Return specific error messages based on error type
    let errorMessage = "Failed to send message. Please try again later."

    if (error.code === "EAUTH") {
      errorMessage = "Email authentication failed. Please contact support."
    } else if (error.code === "ECONNECTION") {
      errorMessage = "Could not connect to email server. Please try again later."
    } else if (error.code === "ETIMEDOUT") {
      errorMessage = "Email server timeout. Please try again later."
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    })
  }
}
