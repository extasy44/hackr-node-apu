exports.registerEmailParams = (email, token) => {
  return {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [email]
    },
    ReplyToAddresses: [process.env.EMAIL_TO],
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `<html>
          <h1>Verify your email address</h1>
          <p>Please use the following link to complete your registration : </p>
          <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
          </html>`
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'Complete Your Registration - HiCoding'
      }
    }
  };
};

exports.forgotPasswordEmailParams = (email, token) => {
  return {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [email]
    },
    ReplyToAddresses: [process.env.EMAIL_TO],
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `<html>
          <h2>HiCoding</h2>
          <p>We received a request to reset your password for your account.</p>
          <p>Please use the following link to reset your password : </p>
          <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
          </html>`
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'Reset Password Link - </> HiCoding'
      }
    }
  };
};

exports.linkPublishedParams = (email, data) => {
  return {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [email]
    },
    ReplyToAddresses: [process.env.EMAIL_TO],
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `<html>
          <h2></>HiCoding</h2>
          <p>A new course link ${data.title} has been just published.</p>
          ${data.categories
            .map((c) => {
              return `
              <div>
                <h2>${c.name}<h2>
                <img src="${c.image.url}" alt="${c.name}" style="height:55px;" />
                <h3><a href="${process.env.CLIENT_URL}/links/${c.slug}">Check it out!</a><h3>
            `;
            })
            .join('----------------------------------------')}

          <br />

          <p>Do not want to receive notifications?</p>
          <p>Turn off notification by going to your <b> <a href="${
            process.env.CLIENT_URL
          }/user/profile/update">dashboard</a></b> and uncheck notification</p>
          </html>`
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'New tutorial link has been published - </>HiCoding'
      }
    }
  };
};
