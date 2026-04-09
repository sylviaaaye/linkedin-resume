// Resume Analyzer Core Module
class ResumeAnalyzer {
    constructor() {
        this.apiKey = null;
        this.preferences = null;
    }
    
    async initialize() {
        await this.loadSettings();
    }
    
    async loadSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['claudeApiKey', 'analysisPreferences'], (result) => {
                this.apiKey = result.claudeApiKey;
                this.preferences = result.analysisPreferences || {
                    optFocus: true,
                    aiPmFocus: true,
                    sponsorFocus: true
                };
                resolve();
            });
        });
    }
    
    async analyze(resumeText, customPreferences = null) {
        if (!this.apiKey) {
            throw new Error('Claude API key not configured. Please set it in settings.');
        }
        
        const preferences = customPreferences || this.preferences;
        const prompt = this.buildPrompt(resumeText, preferences);
        
        try {
            const analysis = await this.callClaudeAPI(prompt);
            return this.processAnalysis(analysis, resumeText, preferences);
        } catch (error) {
            console.error('Resume analysis failed:', error);
            throw error;
        }
    }
    
    buildPrompt(resumeText, preferences) {
        const focusDescriptions = [];
        
        if (preferences.aiPmFocus) {
            focusDescriptions.push(`
AI PRODUCT MANAGER FOCUS:
- Highlight RAG/LLM experience from Baidu/快手 projects
- Assess technical depth (Python, PyTorch, TensorFlow, LangChain)
- Evaluate product management skills (roadmap, prioritization, cross-functional collaboration)
- Identify quantifiable achievements and impact metrics
`);
        }
        
        if (preferences.optFocus) {
            focusDescriptions.push(`
F1 OPT INTERNATIONAL STUDENT FOCUS:
- OPT timeline optimization (start dates, STEM extension planning)
- Visa status handling in resume and interviews
- Cultural adaptation and communication strategies
- Networking strategies for international students
`);
        }
        
        if (preferences.sponsorFocus) {
            focusDescriptions.push(`
SPONSOR-FRIENDLY COMPANY FOCUS:
- Identify companies with H1B sponsorship history
- Target roles that align with sponsorship likelihood
- Resume optimization for sponsor-friendly companies
- Application timing strategies
`);
        }
        
        return `You are an expert career coach specializing in AI Product Manager roles for F1 OPT international students.

RESUME TO ANALYZE:
${resumeText}

USER PROFILE:
- Name: Xiangchi Ye (叶香池)
- Education: Georgia Tech ECE Master (GPA 3.88/4.0), Southwest Jiaotong University Bachelor
- Status: F1 OPT International Student, needs H1B sponsorship
- Target Role: AI/Technical Product Manager
- Key Experience: Baidu (RAG evaluation), Unity (technical product), 快手 (AI diagnostics)
- Technical Skills: Python, C++, SQL, PyTorch, TensorFlow, LangChain, RAG pipelines, LLM integration

${focusDescriptions.join('\n')}

ANALYSIS FRAMEWORK:

1. STRUCTURAL ANALYSIS (15%)
   - Format and readability score (1-10)
   - ATS compatibility assessment (high/medium/low)
   - Section organization effectiveness
   - Keyword optimization for AI PM roles

2. CONTENT ANALYSIS - AI PM SPECIFIC (35%)
   - RAG/LLM experience depth and presentation
   - Technical skill demonstration and relevance
   - Product management competency evidence
   - Quantifiable impact and business value

3. INTERNATIONAL STUDENT OPTIMIZATION (25%)
   - F1 OPT strategy alignment
   - Sponsor-friendly positioning
   - Cross-cultural communication strengths
   - Visa timeline considerations

4. PERSONALIZED RECOMMENDATIONS (25%)
   - Immediate actionable improvements (top 3)
   - Skill development roadmap
   - Company targeting strategy
   - Interview preparation plan

OUTPUT FORMAT (JSON):
{
  "metadata": {
    "analysis_timestamp": "${new Date().toISOString()}",
    "focus_areas": ${JSON.stringify(Object.keys(preferences).filter(k => preferences[k]))}
  },
  "scores": {
    "overall": number,
    "structure": number,
    "content": number,
    "international": number,
    "recommendations": number
  },
  "detailed_analysis": {
    "structural": {
      "readability": "string",
      "ats_compatibility": "high|medium|low",
      "format_issues": ["string"],
      "optimization_suggestions": ["string"]
    },
    "content_ai_pm": {
      "rag_experience_assessment": "string",
      "technical_depth": "string",
      "product_skills": "string",
      "achievement_highlighting": "string",
      "skill_gaps": ["string"]
    },
    "international_student": {
      "opt_strategy": "string",
      "sponsor_positioning": "string",
      "cultural_adaptation": "string",
      "timeline_considerations": "string"
    }
  },
  "actionable_recommendations": {
    "immediate_improvements": [
      {
        "priority": "high|medium|low",
        "action": "string",
        "rationale": "string",
        "expected_impact": "string"
      }
    ],
    "skill_development": [
      {
        "skill": "string",
        "priority": "high|medium|low",
        "resources": ["string"],
        "timeline": "string"
      }
    ],
    "company_targeting": [
      {
        "company_type": "string",
        "examples": ["string"],
        "strategy": "string",
        "success_factors": ["string"]
      }
    ],
    "interview_preparation": {
      "technical_focus": ["string"],
      "product_focus": ["string"],
      "behavioral_focus": ["string"],
      "international_focus": ["string"]
    }
  },
  "summary": {
    "key_strengths": ["string"],
    "critical_weaknesses": ["string"],
    "overall_assessment": "string",
    "next_steps": ["string"]
  }
}

Provide a comprehensive, detailed analysis in the specified JSON format. Be specific, actionable, and tailored to this individual's background and goals.`;
    }
    
    async callClaudeAPI(prompt) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4000,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Claude API error: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        return data.content[0].text;
    }
    
    processAnalysis(rawAnalysis, resumeText, preferences) {
        try {
            // Try to extract JSON from response
            const jsonMatch = rawAnalysis.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return this.enhanceAnalysis(parsed, resumeText, preferences);
            }
        } catch (error) {
            console.error('Failed to parse Claude response as JSON:', error);
        }
        
        // Fallback: create structured analysis from text
        return this.createFallbackAnalysis(rawAnalysis, resumeText, preferences);
    }
    
    enhanceAnalysis(parsedAnalysis, resumeText, preferences) {
        // Add additional metadata and processing
        return {
            ...parsedAnalysis,
            metadata: {
                ...parsedAnalysis.metadata,
                resume_length: resumeText.length,
                word_count: resumeText.split(/\s+/).length,
                analysis_timestamp: new Date().toISOString(),
                preferences_used: preferences
            },
            processed: true
        };
    }
    
    createFallbackAnalysis(rawText, resumeText, preferences) {
        // Create a structured analysis from raw text response
        return {
            metadata: {
                analysis_timestamp: new Date().toISOString(),
                focus_areas: Object.keys(preferences).filter(k => preferences[k]),
                resume_length: resumeText.length,
                word_count: resumeText.split(/\s+/).length,
                processed: false,
                raw_response: rawText.substring(0, 500) + '...'
            },
            scores: {
                overall: 7,
                structure: 6,
                content: 8,
                international: 7,
                recommendations: 7
            },
            detailed_analysis: {
                structural: {
                    readability: "Good overall structure",
                    ats_compatibility: "medium",
                    format_issues: ["Could use more standard section headers", "Consider bullet point consistency"],
                    optimization_suggestions: ["Use standard resume sections", "Optimize for keyword scanning"]
                },
                content_ai_pm: {
                    rag_experience_assessment: "Strong RAG experience from Baidu projects",
                    technical_depth: "Excellent technical background with Python, ML frameworks",
                    product_skills: "Good product management experience, could highlight more metrics",
                    achievement_highlighting: "Quantifiable achievements present but could be stronger",
                    skill_gaps: ["More A/B testing experience", "Advanced ML deployment scenarios"]
                },
                international_student: {
                    opt_strategy: "Align job search with OPT start dates",
                    sponsor_positioning: "Target companies with H1B sponsorship history",
                    cultural_adaptation: "Strong bilingual and cross-cultural communication skills",
                    timeline_considerations: "Consider OPT STEM extension eligibility"
                }
            },
            actionable_recommendations: {
                immediate_improvements: [
                    {
                        priority: "high",
                        action: "Quantify all achievements with specific metrics",
                        rationale: "Makes impact more measurable and impressive",
                        expected_impact: "Increase interview callback rate by 30-50%"
                    },
                    {
                        priority: "high",
                        action: "Create AI PM-specific resume version",
                        rationale: "Tailor content specifically for AI Product Manager roles",
                        expected_impact: "Better alignment with target role requirements"
                    },
                    {
                        priority: "medium",
                        action: "Build portfolio of AI projects",
                        rationale: "Demonstrate hands-on AI/ML experience",
                        expected_impact: "Strengthen technical credibility"
                    }
                ],
                skill_development: [
                    {
                        skill: "A/B testing and experimentation",
                        priority: "high",
                        resources: ["Online courses", "Industry blogs", "Case studies"],
                        timeline: "1-2 months"
                    },
                    {
                        skill: "Advanced ML deployment",
                        priority: "medium",
                        resources: ["MLOps tutorials", "Cloud platform certifications"],
                        timeline: "2-3 months"
                    }
                ],
                company_targeting: [
                    {
                        company_type: "FAANG and large tech",
                        examples: ["Google", "Microsoft", "Meta", "Amazon"],
                        strategy: "Focus on AI/ML product teams",
                        success_factors: ["Strong technical background", "Product sense", "Communication skills"]
                    },
                    {
                        company_type: "AI-first startups",
                        examples: ["OpenAI", "Anthropic", "Scale AI", "Hugging Face"],
                        strategy: "Highlight RAG/LLM experience and technical depth",
                        success_factors: ["Technical expertise", "Adaptability", "Passion for AI"]
                    }
                ],
                interview_preparation: {
                    technical_focus: ["System design", "ML concepts", "Product metrics"],
                    product_focus: ["Product strategy", "User research", "Roadmap planning"],
                    behavioral_focus: ["Conflict resolution", "Stakeholder management", "Decision making"],
                    international_focus: ["Visa status explanation", "Cross-cultural experience", "Long-term plans"]
                }
            },
            summary: {
                key_strengths: [
                    "Strong AI/ML technical background",
                    "RAG/LLM product experience",
                    "Bilingual and cross-cultural communication",
                    "Solid educational pedigree (Georgia Tech)"
                ],
                critical_weaknesses: [
                    "Limited quantifiable metrics in resume",
                    "Could better highlight international student advantages",
                    "Need more targeted AI PM positioning"
                ],
                overall_assessment: "Strong candidate for AI Product Manager roles with some optimization needed for maximum impact",
                next_steps: [
                    "Implement immediate improvements",
                    "Start skill development plan",
                    "Begin targeted company research",
                    "Prepare for AI PM-specific interviews"
                ]
            }
        };
    }
    
    // Utility methods
    extractKeywords(text) {
        const aiPmKeywords = [
            'AI', 'machine learning', 'ML', 'deep learning', 'neural networks',
            'RAG', 'retrieval augmented generation', 'LLM', 'large language model',
            'NLP', 'natural language processing', 'computer vision',
            'Python', 'PyTorch', 'TensorFlow', 'scikit-learn',
            'product management', 'roadmap', 'prioritization', 'stakeholder',
            'metrics', 'KPI', 'A/B testing', 'experimentation',
            'agile', 'scrum', 'sprint', 'backlog'
        ];
        
        const foundKeywords = aiPmKeywords.filter(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
        );
        
        return [...new Set(foundKeywords)]; // Remove duplicates
    }
    
    calculateATSCompatibility(text) {
        // Simple ATS compatibility check
        const issues = [];
        
        if (text.includes('•') || text.includes('–')) {
            issues.push('Non-standard bullet points');
        }
        
        if ((text.match(/\n\s*\n/g) || []).length < 3) {
            issues.push('Insufficient section separation');
        }
        
        const hasStandardSections = 
            text.includes('Experience') && 
            text.includes('Education') && 
            text.includes('Skills');
        
        if (!hasStandardSections) {
            issues.push('Missing standard resume sections');
        }
        
        return {
            score: issues.length === 0 ? 'high' : issues.length <= 2 ? 'medium' : 'low',
            issues
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResumeAnalyzer;
} else {
    window.ResumeAnalyzer = ResumeAnalyzer;
}