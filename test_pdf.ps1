$body = @{
    resumeText = @"
John Doe
Email: john@example.com | Phone: (555) 123-4567

OBJECTIVE
Software Developer with 3 years of experience seeking new opportunities.

EDUCATION
• Bachelor of Science in Computer Science, XYZ University (2021)
• GPA: 3.8/4.0

SKILLS
• Programming Languages: JavaScript, Python, Java
• Frameworks: React, Node.js, Express
• Databases: MongoDB, MySQL

EXPERIENCE
Software Developer Intern
ABC Company | June 2021 - August 2021
• Developed web applications using React and Node.js
• Collaborated with team of 5 developers on agile projects
• Improved application performance by 25%

PROJECTS
E-commerce Website
• Built full-stack e-commerce application
• Used React, Node.js, and MongoDB
• Implemented payment gateway integration

ACHIEVEMENTS
• Dean's List for 3 consecutive semesters
• Winner of University Coding Competition 2020
"@
    name = "John Doe"
    email = "john@example.com"
} | ConvertTo-Json

try {
    Write-Host "Making request to PDF endpoint..."
    $response = Invoke-RestMethod -Uri "http://localhost:5001/api/resume/download-pdf" -Method Post -Body $body -ContentType "application/json" -OutFile "test_resume.pdf"
    Write-Host "✅ PDF downloaded successfully! Check test_resume.pdf"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}