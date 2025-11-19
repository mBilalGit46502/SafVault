export function generateWelcomeEmail(username, startLink) {
  const primaryColor = "#f97316"; 
  const accentColor = "#e9e9e9";
  const highlightColor = "#fffbe3"; 

  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to SafVault</title>
            <style>
                /* Global Reset/Base Styles */
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333333; }
                
                /* Container and Layout */
                .container { max-width: 600px; margin: 20px auto; padding: 0; border: 1px solid ${accentColor}; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); }
                .header { text-align: center; padding: 25px 20px; background-color: ${primaryColor}; color: white; border-top-left-radius: 12px; border-top-right-radius: 12px; }
                .header h1 { margin: 0; font-size: 32px; font-weight: bold; }
                
                /* Main Content Area */
                .content { padding: 30px 40px; text-align: left; }
                
                /* Feature Box (Stronger Visual) */
                .feature-box { 
                    background-color: ${highlightColor}; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin-top: 25px; 
                    border: 1px solid #fde68a; /* Soft border */
                }
                .feature-box h3 { color: ${primaryColor}; margin-top: 0; font-size: 20px; font-weight: bold; margin-bottom: 10px; }
                
                /* Call-to-Action Button */
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
                    /* Ensure properties are INLINED for maximum compatibility */
                    border: 1px solid ${primaryColor};
                }

                /* Footer */
                .footer { padding: 15px 20px; border-top: 1px solid ${accentColor}; text-align: center; font-size: 12px; color: #777777; background-color: #fafafa; }
            </style>
        </head>
        <body>
            <div class="container">
                
                <div class="header" style="background-color: ${primaryColor}; color: white;">
                    <p style="margin: 0; font-size: 14px;"></p>
                    <h1 style="color: white; margin-top: 5px;">SafVault</h1>
                </div>

                <div class="content">
                    <h2 style="font-size: 24px; color: #333; margin-top: 0; margin-bottom: 20px;">Welcome Aboard, ${username}!</h2>
                    
                    <p style="font-size: 16px;">
                        Thank you for joining SafVault! We're thrilled to have you secure your files with our zero-trust platform.
                    </p>

                    <div class="feature-box">
                        <h3 style="color: ${primaryColor}; margin-top: 0; font-size: 20px;">Why SafVault is Your Best Choice:</h3>
                        <ul style="font-size: 16px; padding-left: 20px; margin: 0;">
                            <li style="margin-bottom: 8px;">🔒 **Military-Grade Encryption:** Your data is encrypted on your device *before* upload.</li>
                            <li style="margin-bottom: 8px;">🔑 **Tokenized Sharing:** Grant access securely without ever sharing your password.</li>
                            <li>⚡ **Easy Organization:** Simple drag-and-drop management in your new dashboard.</li>
                        </ul>
                    </div>

                    <p style="font-size: 16px; margin-top: 30px;">
                        Your vault is waiting. Click the button below to secure your first document now!
                    </p>

                    <div class="button-container">
                        <a href="${startLink}" class="button" 
                           style="
                                background-color: ${primaryColor}; 
                                color: #ffffff; 
                                border-radius: 8px; 
                                padding: 14px 30px; 
                                font-size: 18px;
                                display: inline-block;
                                text-decoration: none;
                                font-weight: bold;
                           "
                        >
                            Go to My SafVault Dashboard
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; text-align: center; margin-top: 40px; color: #777;">
                        If you need any help, please reply to this email, or visit our support center.
                    </p>
                </div>

                <div class="footer">
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} SafVault. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
