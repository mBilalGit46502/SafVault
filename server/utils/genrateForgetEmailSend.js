export function generatePasswordResetEmail(username, resetLink) {
  const primaryColor = "#f97316"; 
  const accentColor = "#e9e9e9"; 
  const secondaryColor = "#333333";

  const now = new Date();
  const expiryTime = new Date(now.getTime() + 5 * 60000); 

  const formattedExpiryTime = expiryTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SafVault Password Reset</title>
            <style>
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: ${secondaryColor}; background-color: #f4f4f4;}
                .wrapper { background-color: #f4f4f4; padding: 20px 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid ${accentColor}; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); background-color: #ffffff; }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid ${accentColor}; }
                .header h1 { color: ${primaryColor}; margin: 0; font-size: 30px; font-weight: 700; }
                .content { padding: 25px 0; text-align: left; }
                .button-container { text-align: center; margin: 30px 0; }
                .button {
                    display: inline-block;
                    padding: 14px 30px;
                    background-color: ${primaryColor};
                    color: #ffffff !important; 
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: bold;
                    transition: background-color 0.3s;
                }
                .security-note {
                    background-color: #fffbe6; /* Light Yellow/Orange for attention */
                    border-left: 4px solid ${primaryColor};
                    padding: 15px;
                    margin: 20px 0;
                    font-size: 14px;
                    color: ${secondaryColor};
                }
                .footer { padding-top: 20px; border-top: 1px solid ${accentColor}; text-align: center; font-size: 12px; color: #777777; }
                a { color: ${primaryColor}; }
            </style>
        </head>
        <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <h1>SafVault</h1>
                </div>

                <div class="content">
                    <p style="font-size: 16px;">Hello **${
                      username || "User"
                    }**, 👋</p>
                    
                    <p style="font-size: 16px;">You recently requested to reset the password for your SafVault account. To proceed, please click the secure button below:</p>

                    <div class="button-container">
                        <a href="${resetLink}" class="button" target="_blank" style="color: #ffffff;">Reset My Password Now</a>
                    </div>

                    <div class="security-note">
                        <p style="margin: 0;">
                            ⚠️ **Security Alert:** This link will **expire in 5 minutes** from the time this email was sent, specifically at **${formattedExpiryTime}**. 
                            If you click the link after this time, you will need to start the process over.
                        </p>
                    </div>
                    
                    <p style="font-size: 14px; margin-top: 25px; color: #555;">
                        If the button above doesn't work, copy and paste the following URL into your browser: <br/>
                        <a href="${resetLink}" style="word-break: break-all; color: ${primaryColor};">${resetLink}</a>
                    </p>
                    
                    <p style="font-size: 14px; color: #555;">
                        If you did not request this password reset, please ignore this email. Your account remains secure.
                    </p>
                </div>

                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} SafVault. All rights reserved.</p>
                    <p>Keeping your digital files secure.</p>
                </div>
            </div>
        </div>
        </body>
        </html>
    `;
}
