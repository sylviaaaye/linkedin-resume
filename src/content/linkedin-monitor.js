// LinkedIn Job Monitor Content Script
// Monitors LinkedIn job listings for AI PM roles and sponsor-friendly companies

class LinkedInMonitor {
    constructor() {
        this.jobListings = new Map();
        this.sponsorKeywords = ['sponsor', 'h1b', 'visa', 'work authorization', 'immigration'];
        this.aiPmKeywords = ['ai product', 'machine learning product', 'ml product', 'artificial intelligence product'];
        this.init();
    }
    
    init() {
        this.observePageChanges();
        this.scanCurrentPage();
        this.setupMessageListener();
    }
    
    observePageChanges() {
        // Observe DOM changes to detect new job listings
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    this.scanNewNodes(mutation.addedNodes);
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    scanCurrentPage() {
        // Scan current page for job listings
        const jobCards = document.querySelectorAll('[data-job-id], .job-card-container, [class*="job-card"]');
        jobCards.forEach(card => {
            this.analyzeJobCard(card);
        });
    }
    
    scanNewNodes(nodes) {
        nodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if this is a job card
                if (node.matches('[data-job-id], .job-card-container, [class*="job-card"]')) {
                    this.analyzeJobCard(node);
                }
                
                // Also check children
                const jobCards = node.querySelectorAll('[data-job-id], .job-card-container, [class*="job-card"]');
                jobCards.forEach(card => {
                    this.analyzeJobCard(card);
                });
            }
        });
    }
    
    analyzeJobCard(jobCard) {
        try {
            const jobId = this.extractJobId(jobCard);
            if (!jobId || this.jobListings.has(jobId)) {
                return;
            }
            
            const jobData = {
                id: jobId,
                title: this.extractJobTitle(jobCard),
                company: this.extractCompany(jobCard),
                location: this.extractLocation(jobCard),
                postedTime: this.extractPostedTime(jobCard),
                description: '',
                sponsorMentioned: false,
                aiPmRelevant: false,
                score: 0
            };
            
            // Check if job is relevant
            jobData.aiPmRelevant = this.isAiPmRelevant(jobData.title);
            jobData.sponsorMentioned = this.checkSponsorMention(jobCard);
            
            // Calculate relevance score
            jobData.score = this.calculateRelevanceScore(jobData);
            
            // Store job
            this.jobListings.set(jobId, jobData);
            
            // If highly relevant, highlight and notify
            if (jobData.score >= 8) {
                this.highlightJobCard(jobCard, jobData);
                this.notifyNewJob(jobData);
            }
            
            console.log('Analyzed job:', jobData);
            
        } catch (error) {
            console.error('Error analyzing job card:', error);
        }
    }
    
    extractJobId(jobCard) {
        // Try various methods to extract job ID
        return jobCard.dataset.jobId || 
               jobCard.getAttribute('data-occludable-job-id') ||
               jobCard.querySelector('[data-job-id]')?.dataset.jobId ||
               this.generateJobId(jobCard);
    }
    
    generateJobId(jobCard) {
        // Generate a unique ID based on job content
        const title = this.extractJobTitle(jobCard);
        const company = this.extractCompany(jobCard);
        return `${company}-${title}`.replace(/\s+/g, '-').toLowerCase();
    }
    
    extractJobTitle(jobCard) {
        return jobCard.querySelector('.job-card-list__title, [class*="job-title"], h3')?.textContent?.trim() || 'Unknown Title';
    }
    
    extractCompany(jobCard) {
        return jobCard.querySelector('.job-card-container__company-name, [class*="company-name"]')?.textContent?.trim() || 'Unknown Company';
    }
    
    extractLocation(jobCard) {
        return jobCard.querySelector('.job-card-container__metadata-item, [class*="location"]')?.textContent?.trim() || 'Unknown Location';
    }
    
    extractPostedTime(jobCard) {
        const timeText = jobCard.querySelector('.job-card-container__listed-time, [class*="posted-time"]')?.textContent?.trim() || '';
        return this.parsePostedTime(timeText);
    }
    
    parsePostedTime(timeText) {
        // Parse LinkedIn time format (e.g., "Posted 2 hours ago")
        const match = timeText.match(/(\d+)\s+(hour|day|week|month)/i);
        if (match) {
            const amount = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            
            const now = new Date();
            if (unit === 'hour') {
                return new Date(now.getTime() - amount * 60 * 60 * 1000);
            } else if (unit === 'day') {
                return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
            } else if (unit === 'week') {
                return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
            } else if (unit === 'month') {
                return new Date(now.getTime() - amount * 30 * 24 * 60 * 60 * 1000);
            }
        }
        return new Date();
    }
    
    isAiPmRelevant(title) {
        const lowerTitle = title.toLowerCase();
        return this.aiPmKeywords.some(keyword => lowerTitle.includes(keyword));
    }
    
    checkSponsorMention(jobCard) {
        // Check job card text for sponsor mentions
        const text = jobCard.textContent.toLowerCase();
        return this.sponsorKeywords.some(keyword => text.includes(keyword));
    }
    
    calculateRelevanceScore(jobData) {
        let score = 0;
        
        // AI PM relevance (most important)
        if (jobData.aiPmRelevant) score += 6;
        
        // Sponsor mention
        if (jobData.sponsorMentioned) score += 3;
        
        // Recency (within 24 hours)
        const hoursAgo = (new Date() - jobData.postedTime) / (1000 * 60 * 60);
        if (hoursAgo <= 24) score += 2;
        else if (hoursAgo <= 72) score += 1;
        
        // Location (prefer US)
        if (jobData.location.toLowerCase().includes('united states') || 
            jobData.location.toLowerCase().includes('us') ||
            jobData.location.toLowerCase().includes('usa')) {
            score += 1;
        }
        
        return Math.min(10, score);
    }
    
    highlightJobCard(jobCard, jobData) {
        // Add visual highlight to relevant jobs
        const highlightColor = jobData.score >= 9 ? '#10b981' : '#f59e0b';
        
        jobCard.style.borderLeft = `4px solid ${highlightColor}`;
        jobCard.style.paddingLeft = '8px';
        jobCard.style.backgroundColor = `${highlightColor}10`;
        
        // Add badge
        const badge = document.createElement('div');
        badge.className = 'us-resume-assistant-badge';
        badge.innerHTML = `
            <span style="
                background: ${highlightColor};
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                margin-left: 8px;
            ">
                ${jobData.score >= 9 ? '🌟 Top Match' : '🎯 Good Match'}
            </span>
        `;
        
        const titleElement = jobCard.querySelector('.job-card-list__title, h3');
        if (titleElement) {
            titleElement.appendChild(badge);
        }
    }
    
    notifyNewJob(jobData) {
        // Send notification to background script
        chrome.runtime.sendMessage({
            action: 'newJobFound',
            jobData: jobData
        });
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getJobStats') {
                sendResponse({
                    totalJobs: this.jobListings.size,
                    relevantJobs: Array.from(this.jobListings.values()).filter(j => j.score >= 6).length,
                    topMatches: Array.from(this.jobListings.values()).filter(j => j.score >= 8)
                });
            }
        });
    }
}

// Initialize monitor when page is loaded
if (window.location.hostname.includes('linkedin.com')) {
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.linkedinMonitor = new LinkedInMonitor();
        });
    } else {
        window.linkedinMonitor = new LinkedInMonitor();
    }
}