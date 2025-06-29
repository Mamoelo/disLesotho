//uploadFormscript.js
async function initNavbar() {
  const navbar = document.getElementById('contentTypeNavbar');
  let currentContentType = 'news';
  
  // Add News button
  const newsBtn = createNavButton('News', 'news');
  newsBtn.classList.add('active');
  navbar.appendChild(newsBtn);
  
  try {
    // Fetch information types from the server
    const res = await fetch('http://localhost:3000/api/information-types', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch informtion types');
    const infoTypes = await res.json();

    if (!Array.isArray(infoTypes)) {
      console.error('[UI] infoTypes isn’t an array—got:', infoTypes);
      return;
    }
    
    infoTypes.forEach(type => {
      if (type.type_name === 'Partner') {
        // Create dropdown for Partner
        const partnerContainer = document.createElement('div');
        partnerContainer.className = 'nav-item';
        
        const partnerBtn = createNavButton('Partner↓', 'partner');
        partnerBtn.onclick = () => togglePartnerDropdown(partnerContainer);
        
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        
        // Fetch and populate partner types
        fetchPartnerTypes(dropdown);
        
        partnerContainer.appendChild(partnerBtn);
        partnerContainer.appendChild(dropdown);
        navbar.appendChild(partnerContainer);
      } else if (type.type_name === 'Application Owner') {
        const btn = createNavButton('Us', 'application owner');
        navbar.appendChild(btn);
      } else {
        // Regular information type
        const btn = createNavButton(type.type_name, type.type_name.toLowerCase());
        navbar.appendChild(btn);
      }
    });
  } catch (error) {
    console.error('[UI] Error loading information types:', error);
  }
  
  // Add Stream button
  const streamBtn = createNavButton('Stream', 'stream');
  navbar.appendChild(streamBtn);
  
  // Set up navbar button click handlers
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Remove active class from all buttons
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      this.classList.add('active');
      
      currentContentType = this.dataset.type;
      updateFormForContentType(currentContentType);
    });
  });
  
  // Create a navigation button
  function createNavButton(text, type) {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.textContent = text;
    btn.dataset.type = type;
    return btn;
  }
  
  // Toggle partner dropdown
  function togglePartnerDropdown(container) {
    const dropdown = container.querySelector('.dropdown');
    dropdown.classList.toggle('active');
  }
  
  // Fetch and populate partner types
  async function fetchPartnerTypes(dropdown) {
    try {
      const res = await fetch('http://localhost:3000/api/partner-types', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch partner types');

      const partnerTypes = await res.json();
      
      partnerTypes.forEach(type => {
        const item = document.createElement('button');
        item.className = 'dropdown-item';
        item.textContent = type.type_name;
        item.onclick = function() {
          document.querySelector('.nav-btn[data-type="partner"]').click();
          document.getElementById('partnerType').value = type.type_name;
        };
        dropdown.appendChild(item);
      });
    } catch (error) {
      console.error('Error loading partner types:', error);
    }
  }

  // helper to capitalize first letter
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // map your dataset.type values to nice labels
  const TYPE_LABELS = {
    news: "News",
    partner: "Partner",
    speaker: "Speaker",
    event: "Event",
    // if you have an “Application Owner” type, normalize its key:
    "application owner": "About Us",
  };
  
  // Update form fields based on content type
  function updateFormForContentType(type) {
    const base = TYPE_LABELS[type] || capitalize(type);
    const titleEl = document.getElementById("contentTitle");
    const iconHtml = titleEl.querySelector("i").outerHTML;

    titleEl.innerHTML = iconHtml + ` ${base} Content`;

    const titleEl2 = document.getElementById("attributesTitle");
    const iconHtml2 = titleEl2.querySelector("i").outerHTML;

    titleEl2.innerHTML = iconHtml2 + ` ${base} Attributes`;
    
    const additionalFields = document.getElementById('additionalFields');
    additionalFields.innerHTML = '';
    
    switch(type) {
      case 'partner':
        additionalFields.innerHTML = `
          <div class="form-group">
            <label for="partnerType">Partner Type</label>
            <input type="text" id="partnerType" readonly />
          </div>
          <div class="form-group">
            <label for="partnerWebsite">Website</label>
            <input type="url" id="partnerWebsite" placeholder="https://example.com" />
          </div>
          <div class="form-group">
            <label for="contactEmail">Contact Email</label>
            <input type="email" id="contactEmail" placeholder="contact@example.com" />
          </div>
        `;
        break;
        
      case 'speaker':
        additionalFields.innerHTML = `
          <div class="form-group">
            <label for="speakerOrganization">Organization</label>
            <input type="text" id="speakerOrganization" placeholder="Speaker's organization" />
          </div>
          <div class="form-group">
            <label for="speakerBio">Bio</label>
            <textarea id="speakerBio" placeholder="Speaker biography"></textarea>
          </div>
        `;
        break;
        
      case 'event':
        additionalFields.innerHTML = `
          <div class="form-group">
            <label for="eventDate">Event Date</label>
            <input type="datetime-local" id="eventDate" />
          </div>
          <div class="form-group">
            <label for="eventLocation">Location</label>
            <input type="text" id="eventLocation" placeholder="Event location" />
          </div>
        `;
        break;
    }
  }
}

const newsForm = document.getElementById('newsForm');
newsForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const title = document.getElementById('newsTitle').value.trim();
  const content = document.getElementById('newsContent').value.trim();
  if (!title || !content) {
    alert('Title and content are required');
    return;
  }
  
  try {
    const res = await fetch('/api/content-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ title, content })
    });
    if (!res.ok) throw new Error(await res.text());
    alert('Content saved and document created successfully');
    newsForm.reset();
  } catch (err) {
    console.error('Submit failed:', err);
    alert('Error: ' + err.message);
  }
});

async function loadExistingDocs() {
  const container = document.getElementById('existingPosts');
  container.innerHTML = '<h3>Existing Documents</h3><ul id="docList"></ul>';
  try {
    const res = await fetch('/api/content-details', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const docs = await res.json();
    const ul = document.getElementById('docList');
    docs.forEach(doc => {
      const li = document.createElement('li');
      li.textContent = doc.code_name + ' (' + new Date(doc.created_at).toLocaleString() + ')';

      // Download link
      const dl = document.createElement('a');
      dl.textContent = 'Download';
      dl.href = `/uploads/${doc.folder_path}/${doc.code_name}.docx`;
      dl.target = '_blank';
      dl.style.margin = '0 8px';

      // Delete button
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.style.margin = '0 8px';
      del.onclick = async () => {
        if (!confirm('Delete this document?')) return;
        const dres = await fetch(`/api/content-details/${doc.detail_id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (dres.ok) loadExistingDocs();
        else alert('Delete failed');
      };

      // Expand/Retract button
      const exp = document.createElement('button');
      exp.textContent = 'Expand';
      let expanded = false;
      exp.style.margin = '0 8px';

      exp.onclick = async () => {
        if (!expanded) {
          // Fetch full details
          const det = await fetch(`/api/content-details/${doc.detail_id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }).then(r => r.json());

          // Show details under the list item
          const detailsDiv = document.createElement('div');
          detailsDiv.className = 'doc-details';
          detailsDiv.innerHTML = `
            <p><strong>Code:</strong> ${det.code_name}</p>
            <p><strong>Created:</strong> ${new Date(det.created_at).toLocaleString()}</p>
            <p><strong>Content:</strong><br>${det.content.replace(/\n/g,'<br>')}</p>
            <button class="edit-btn">Edit</button>
          `;
          li.appendChild(detailsDiv);

          // Wire up the inline Edit button
          detailsDiv.querySelector('.edit-btn').onclick = () => {
            document.getElementById('newsTitle').value = det.title;
            document.getElementById('newsContent').value = det.content;
            // Switch form to update mode
            newsForm.onsubmit = async e => {
              e.preventDefault();
              const newTitle = document.getElementById('newsTitle').value;
              const newContent = document.getElementById('newsContent').value;
              await fetch(`/api/content-details/${doc.detail_id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ title: newTitle, content: newContent })
              });
              alert('Content updated!');
            };
          };

          exp.textContent = 'Retract';
          expanded = true;
        } else {
          // Remove the details div
          const details = li.querySelector('.doc-details');
          if (details) li.removeChild(details);
          exp.textContent = 'Expand';
          expanded = false;
        }
      };

      li.append(dl, exp, del);
      ul.appendChild(li);
    });
  } catch (err) {
    container.textContent = 'Error loading documents';
    console.error(err);
  }
}

// If the element is already present, run now:
initNavbar();
loadExistingDocs();