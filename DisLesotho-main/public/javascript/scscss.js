// Add this helper function at the top of your script
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Replace the entire highlightSelection function
function highlightSelection() {
  const textarea = document.getElementById("newsContent");
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  if (start === end) {
    alert("Please select some text to highlight.");
    return;
  }

  const text = textarea.value.substring(start, end);
  if (!text.trim()) return; // Don't highlight empty selection

  // Create unique ID for this highlight
  const highlightId =
    "hl-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);

  // Store highlight metadata
  permanentHighlights.push({
    id: highlightId,
    start,
    end,
    text,
  });

  // Update preview
  updatePreview();
}

// Replace the updatePreview function's content processing
function updatePreview() {
  const title = escapeHTML(
    document.getElementById("newsTitle").value || "News Title"
  );
  const rawContent = document.getElementById("newsContent").value || "";
  const location = escapeHTML(
    document.getElementById("location").value || "Location not specified"
  );
  const host = escapeHTML(
    document.getElementById("host").value || "Author not specified"
  );
  const contentType = document.getElementById("contentType").value
    ? document.getElementById("contentType").options[
        document.getElementById("contentType").selectedIndex
      ].text
    : "Not specified";

  // Process content with highlights
  let processedContent = "";
  let lastIndex = 0;
  const sortedHighlights = [...permanentHighlights].sort(
    (a, b) => a.start - b.start
  );

  // Apply highlights in order
  sortedHighlights.forEach((hl) => {
    // Add content before highlight
    processedContent += escapeHTML(rawContent.substring(lastIndex, hl.start));

    // Add highlighted content
    processedContent += `<span class="permanent-highlight" data-id="${
      hl.id
    }">${escapeHTML(hl.text)}</span>`;

    lastIndex = hl.end;
  });

  // Add remaining content after last highlight
  processedContent += escapeHTML(rawContent.substring(lastIndex));

  // Replace newlines with <br> tags
  processedContent = processedContent.replace(/\n/g, "<br>");

  // ... rest of the original updatePreview code (partners, contributors, etc) ...
  // Keep all the existing code for generating partners and contributors HTML

  // Build the preview HTML (same as before, but use processedContent)
  const previewHTML = `
        <div class="preview-news">
            <h2>${title}</h2>
            <p>
                <strong>Location:</strong> ${location} | 
                <strong>Host:</strong> ${host} | 
                <strong>Type:</strong> ${contentType}
                ${
                  articleTimestamp
                    ? `| <strong>Timestamp:</strong> ${articleTimestamp}`
                    : ""
                }
            </p>
            <div class="news-content">${processedContent}</div>
        </div>
        
        ${
          partnersHTML
            ? `
        <div class="preview-partners">
            <h3><i class="fas fa-handshake"></i> Partners</h3>
            ${partnersHTML}
        </div>`
            : ""
        }
        
        ${
          contributorsHTML
            ? `
        <div class="preview-contributors">
            <h3><i class="fas fa-users"></i> Contributors</h3>
            <div class="contributor-list">
                ${contributorsHTML}
            </div>
        </div>`
            : ""
        }
    `;

  previewContent.innerHTML = previewHTML;
  updateDataSummary();
}

// Update the double-click event listener
previewContent.addEventListener("dblclick", function (e) {
  if (e.target.classList.contains("permanent-highlight")) {
    const highlightId = e.target.dataset.id;

    // Remove highlight from storage
    const index = permanentHighlights.findIndex((hl) => hl.id === highlightId);
    if (index !== -1) {
      permanentHighlights.splice(index, 1);
    }

    // Update preview
    updatePreview();
    updateDataSummary();
  }
});

// Add this to the form submit handler
newsForm.addEventListener("submit", function (e) {
  e.preventDefault();
  // ... existing collection code ...

  // Reset highlights
  permanentHighlights = [];

  // ... rest of existing code ...
});
