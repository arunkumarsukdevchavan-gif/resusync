const trainingData = {
  resumeJobPairs: [
    {
      resume: "Software Engineer with 5 years experience in JavaScript, React, Node.js. Built scalable web applications serving 10k+ users. Led team of 4 developers.",
      jobDescription: "Senior Software Engineer position requiring React, Node.js, JavaScript expertise. Lead development team and build scalable applications.",
      suggestions: [
        "Add specific metrics about application performance improvements",
        "Include experience with testing frameworks and CI/CD",
        "Mention cloud platforms like AWS or Azure",
        "Highlight leadership achievements with quantified results"
      ],
      optimizedResume: "Senior Software Engineer with 5+ years of expertise in full-stack development using JavaScript, React, and Node.js. Proven track record of building scalable web applications serving 10,000+ users and leading high-performing development teams."
    }
  ],
  additionalITSamples: [
    {
      resume: "DevOps Engineer experienced with CI/CD, Docker, Kubernetes, Terraform and AWS.",
      jobDescription: "DevOps Engineer role requires Terraform, Kubernetes, Docker, cloud automation and CI/CD pipeline experience.",
      suggestions: [
        "Add concrete CI/CD tools used",
        "Quantify deployment frequency improvements"
      ],
      optimizedResume: "DevOps Engineer with strong expertise in infrastructure automation, CI/CD pipelines, and cloud operations."
    }
  ]
};

module.exports = trainingData;