const sendGridMail = require('@sendgrid/mail')
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY)

exports.contactForm = (req, res) => {
	const { email, name, message } = req.body

	const emailData = {
		to: process.env.EMAIL_TO,
		from: email,
		subject: `Contact form - ${process.env.APP_NAME}`,
		text: `Email received from contact form \n Sender name: ${name} \n Sender email: ${email} \n Sender message: ${message}`,
		html: `
			<h4>Email received from contact form:</h4>
			<p>Sender name: ${name}</p>
			<p>Sender email: ${email}</p>
			<p>Sender message: ${message}</p>
			<hr />
			<p>This email may contain sensitive information</p>
			<p>https://writingfolds.com</p>
		`
	}

	sendGridMail.send(emailData).then(sent => {
		return res.json({
			success: true
		})
	}).catch((error) => {
		console.log(error.response.body)
	})
}

exports.contactUserForm = (req, res) => {
	const { userEmail, email, name, message } = req.body

	let mailList = [userEmail]

	const emailData = {
		to: mailList,
		from: process.env.EMAIL_FROM,
		subject: `Someone messaged you from - ${process.env.APP_NAME}`,
		text: `Email received from contact form \n Sender name: ${name} \n Sender email: ${email} \n Sender message: ${message}`,
		html: `
			<h4>Message received from ${name}</h4>
			<br/>
			<p>${message}</p>
			<p>Sender email: ${email}</p>
			
			<hr />
			<p>This email may contain sensitive information</p>
			<a href="https://writingfolds.com/">Writingfolds.com/</a>
		`
	}

	sendGridMail.send(emailData).then(sent => {
		return res.json({
			success: true
		})
	}).catch((error) => {
		console.log(error.response.body)
	})
}