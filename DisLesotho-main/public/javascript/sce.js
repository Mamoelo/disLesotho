// Replace the entire highlightSelection function
function highlightSelection() {
  const textarea = document.getElementById("newsContent");
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  if (start === end) {
    alert("Please select some text to highlight.");
    return;
  }

  // Create unique ID for this highlight
  const highlightId =
    "hl-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);

  // Store highlight metadata
  permanentHighlights.push({
    id: highlightId,
    start,
    end,
    text: textarea.value.substring(start, end),
  });

  // Update preview
  updatePreview();
}

// Replace the updatePreview function's highlight processing
function updatePreview() {
  // ... existing code until content processing ...

  let processedContent = content;

  // Process highlights using index positions
  let highlightOffset = 0;
  const sortedHighlights = [...permanentHighlights].sort(
    (a, b) => a.start - b.start
  );

  sortedHighlights.forEach((hl) => {
    const adjustedStart = hl.start + highlightOffset;
    const adjustedEnd = hl.end + highlightOffset;

    // Only process if highlight is still within content bounds
    if (adjustedEnd <= processedContent.length) {
      const before = processedContent.substring(0, adjustedStart);
      const highlightText = processedContent.substring(
        adjustedStart,
        adjustedEnd
      );
      const after = processedContent.substring(adjustedEnd);

      processedContent =
        before +
        `<span class="permanent-highlight" data-id="${hl.id}">${highlightText}</span>` +
        after;

      // Update offset for next highlights
      highlightOffset += 47 + hl.id.length; // Length of added HTML
    }
  });

  // ... rest of existing code ...
}

// Update the previewContent double-click event listener
previewContent.addEventListener("dblclick", function (e) {
  if (e.target.classList.contains("permanent-highlight")) {
    const highlightId = e.target.dataset.id;

    // Remove highlight from storage
    permanentHighlights = permanentHighlights.filter(
      (hl) => hl.id !== highlightId
    );

    // Update preview
    updatePreview();
    updateDataSummary();
  }
});

// Update the form submit handler to reset highlights
newsForm.addEventListener("submit", function (e) {
  // ... existing code ...

  // Reset highlights
  permanentHighlights = [];

  // ... rest of existing code ...
});
