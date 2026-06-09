import type { Article } from "@/types/db";

const HR = `<hr style="margin:16px 0;border:none;border-top:1px solid #D0D0D0;">`;

function section(label: string, html: string): string {
  const text = html.trim();
  if (!text) return "";
  return `<p style="margin:0 0 4px 0;font-size:10px;font-weight:700;color:#616161;text-transform:uppercase;letter-spacing:.5px">${label}</p>${text}`;
}

function plain(text: string): string {
  if (!text?.trim()) return "";
  return `<span>${text.trim()}</span>`;
}

export function formatArticleForAnalysis(article: Article): string {
  const parts: string[] = [];

  if (article.articleContent?.trim()) {
    parts.push(article.articleContent.trim());
  }

  const wizard: string[] = [];

  if (article.infoBeforeEvent?.trim())
    wizard.push(section("Information Before Event", plain(article.infoBeforeEvent)));

  if (article.motherNatureConsiderations?.trim())
    wizard.push(section("Mother Nature Considerations", plain(article.motherNatureConsiderations)));

  if (article.negativeFunction?.trim())
    wizard.push(section("Negative Function", plain(article.negativeFunction)));

  if (article.problemDetails?.trim())
    wizard.push(section("Problem Details", plain(article.problemDetails)));

  if (article.relationshipDetails?.trim())
    wizard.push(section("Relationship Details", plain(article.relationshipDetails)));

  if (article.preEventObservation?.trim())
    wizard.push(section("Pre-Event Observation", plain(article.preEventObservation)));

  if (article.postEventObservation?.trim())
    wizard.push(section("Post-Event Observation", plain(article.postEventObservation)));

  if (article.consideration?.trim())
    wizard.push(section("Consideration", plain(article.consideration)));

  if (article.productFunction?.trim())
    wizard.push(section("Product Function", plain(article.productFunction)));

  if (article.problemSolved?.trim())
    wizard.push(section("Problem Solved", plain(article.problemSolved)));

  if (article.functionExecutedDuringReview?.trim())
    wizard.push(section("Function Executed During Review", plain(article.functionExecutedDuringReview)));

  if (article.additionalInformation?.trim())
    wizard.push(section("Additional Information", plain(article.additionalInformation)));

  if (wizard.length > 0) {
    if (parts.length > 0) parts.push(HR);
    parts.push(wizard.join(HR));
  }

  return parts.join("");
}
