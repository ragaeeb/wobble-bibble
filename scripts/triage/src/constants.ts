/**
 * Constants and regex patterns for the triage agent
 */

// Regex to extract attachment URLs from GitHub issue body
export const ATTACHMENT_URL_REGEX = /https:\/\/github\.com\/user-attachments\/files\/\d+\/[^\s)]+\.txt/gi;
