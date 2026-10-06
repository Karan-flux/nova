(() => {
  const $ = (selector) => document.querySelector(selector);
  const authView = $('#auth-view');
  const appView = $('#app-view');
  const authForm = $('#auth-form');
  const authMessage = $('#auth-message');
  const projectDialog = $('#project-dialog');
  const projectForm = $('#project-form');
  let projects = [];
  let settings = {};
  let uploadInProgress = false;
  let toastTimer;

  const copyGroups = [
    {
      title: 'Studio details',
      description: 'Brand name and the WhatsApp number used by contact links.',
      fields: [
        ['brandName', 'Brand name'],
        ['logoImageUrl', 'Brand logo'],
        ['accentColor', 'Brand accent color'],
        ['whatsappNumber', 'WhatsApp number']
      ]
    },
    {
      title: 'Hero',
      description: 'The first message visitors see on your homepage.',
      fields: [
        ['heroEyebrow', 'Small heading'],
        ['heroTitleLead', 'Headline first lines', true],
        ['heroTitleAccent', 'Highlighted word'],
        ['heroTitleEnd', 'Headline final line'],
        ['heroIntro', 'Supporting text', true],
        ['heroImageUrl', 'Hero photograph URL']
      ]
    },
    {
      title: 'Introduction',
      description: 'The short studio statement below the hero.',
      fields: [
        ['introEyebrow', 'Small heading'],
        ['introTitleLead', 'Headline first line'],
        ['introTitleAccent', 'Highlighted line'],
        ['introTitleEnd', 'Headline final line'],
        ['introBody', 'Supporting text', true]
      ]
    },
    {
      title: 'Projects section',
      description: 'The heading and note above your project gallery.',
      fields: [
        ['workEyebrow', 'Small heading'],
        ['workTitleLead', 'Headline first line'],
        ['workTitleAccent', 'Highlighted line'],
        ['workDescription', 'Supporting text', true]
      ]
    },
    {
      title: 'Services',
      description: 'Edit the four service rows and their section heading.',
      fields: [
        ['servicesEyebrow', 'Small heading'],
        ['servicesTitleLead', 'Headline first line'],
        ['servicesTitleAccent', 'Highlighted line'],
        ['servicesDescription', 'Section summary', true],
        ...Array.from({ length: 4 }, (_, index) => {
          const number = index + 1;
          return [
            [`service${number}Title`, `Service ${number} name`],
            [`service${number}Tagline`, `Service ${number} short line`],
            [`service${number}Detail`, `Service ${number} description`, true]
          ];
        }).flat()
      ]
    },
    {
      title: 'Industries',
      description: 'Edit the section heading and each audience card, including its photo URL.',
      fields: [
        ['industriesEyebrow', 'Small heading'],
        ['industriesTitleLead', 'Headline first line'],
        ['industriesTitleAccent', 'Highlighted line'],
        ['industriesDescription', 'Section summary', true],
        ...Array.from({ length: 3 }, (_, index) => {
          const number = index + 1;
          return [
            [`industry${number}Title`, `Industry ${number} name`],
            [`industry${number}Tagline`, `Industry ${number} short line`],
            [`industry${number}Detail`, `Industry ${number} description`, true],
            [`industry${number}Link`, `Industry ${number} link text`],
            [`industry${number}Tag`, `Industry ${number} photo label`],
            [`industry${number}ImageUrl`, `Industry ${number} photo URL`]
          ];
        }).flat()
      ]
    },
    {
      title: 'Automation',
      description: 'Update the automation section, examples, and supporting image.',
      fields: [
        ['automationEyebrow', 'Small heading'],
        ['automationTitleLead', 'Headline first lines', true],
        ['automationTitleAccent', 'Highlighted lines', true],
        ['automationIntro', 'Section introduction', true],
        ['automationImageCaption', 'Photo caption'],
        ['automationImageUrl', 'Section photo URL'],
        ...Array.from({ length: 4 }, (_, index) => {
          const number = index + 1;
          return [
            [`workflow${number}Title`, `Workflow ${number} name`],
            [`workflow${number}Detail`, `Workflow ${number} description`, true]
          ];
        }).flat(),
        ['handoffTitle', 'Human handoff heading'],
        ['handoffText', 'Human handoff text', true],
        ['automationCta', 'Button text']
      ]
    },
    {
      title: 'Our process',
      description: 'Edit the three steps and their closing labels.',
      fields: [
        ['approachEyebrow', 'Small heading'],
        ['approachTitleLead', 'Headline first line'],
        ['approachTitleAccent', 'Highlighted line'],
        ['approachDescription', 'Section summary', true],
        ...Array.from({ length: 3 }, (_, index) => {
          const number = index + 1;
          return [
            [`process${number}Title`, `Step ${number} name`],
            [`process${number}Detail`, `Step ${number} description`, true],
            [`process${number}Foot`, `Step ${number} label`]
          ];
        }).flat()
      ]
    },
    {
      title: 'Contact and footer',
      description: 'The closing invitation and short footer line.',
      fields: [
        ['contactEyebrow', 'Small heading'],
        ['contactTitle', 'Contact heading'],
        ['contactIntro', 'Contact text', true],
        ['footerTagline', 'Footer tagline'],
        ['footerNoteHeading', 'Footer note heading'],
        ['footerNoteText', 'Footer note', true],
        ['footerSecondLine', 'Footer closing line']
      ]
    }
  ];

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers
      }
    });
    if (response.status === 204) return null;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'The request could not be completed.');
    return body;
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
  }

  function showMessage(element, message) {
    element.textContent = message;
    element.hidden = false;
  }

  function setAuthenticated(authenticated) {
    authView.hidden = authenticated;
    appView.hidden = !authenticated;
  }

  function configureAuth(setupRequired) {
    $('#auth-title').textContent = setupRequired ? 'Set your password.' : 'Welcome back.';
    $('#auth-copy').textContent = setupRequired
      ? 'Create the password you will use to manage this website.'
      : 'Sign in to update your website.';
    $('#auth-submit').textContent = setupRequired ? 'Create password' : 'Sign in';
    $('#password-label').textContent = setupRequired ? 'Create admin password' : 'Password';
    $('#admin-password').autocomplete = setupRequired ? 'new-password' : 'current-password';
    $('#admin-password').minLength = setupRequired ? 12 : 1;
    $('#password-hint').hidden = !setupRequired;
    authForm.dataset.mode = setupRequired ? 'setup' : 'login';
  }

  function fieldElement(key, label, multiline) {
    const imageField = key.endsWith('ImageUrl');
    const wrapper = document.createElement(imageField ? 'div' : 'label');
    if (multiline || imageField) wrapper.className = 'wide-field';
    const caption = document.createElement(imageField ? 'label' : 'span');
    caption.className = 'field-label';
    caption.textContent = label;
    if (imageField) caption.htmlFor = key;
    const field = document.createElement(multiline ? 'textarea' : 'input');
    if (!multiline) field.type = imageField ? 'text' : key === 'accentColor' ? 'color' : 'text';
    field.id = key;
    field.name = key;
    field.value = settings[key] || '';
    field.required = true;
    if (field.type !== 'color') field.maxLength = imageField ? 1000 : /Detail|Description|Body|Intro|Text|Lead|Accent|Note/.test(key) ? 700 : 180;
    if (multiline) field.rows = 3;
    if (!imageField) {
      wrapper.append(caption, field);
      return wrapper;
    }

    const row = document.createElement('div');
    row.className = 'copy-image-row';
    const fileId = `upload-${key}`;
    const uploadLabel = document.createElement('label');
    uploadLabel.className = 'button button-secondary';
    uploadLabel.htmlFor = fileId;
    uploadLabel.textContent = 'Upload';
    const fileInput = document.createElement('input');
    fileInput.className = 'visually-hidden';
    fileInput.id = fileId;
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/webp,image/gif,image/avif';
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      uploadInProgress = true;
      $('#save-copy').disabled = true;
      try {
        const formData = new FormData();
        formData.append('image', file);
        const result = await request('/api/admin/uploads', { method: 'POST', body: formData });
        field.value = result.url;
        showToast(`${label} uploaded. Save changes to publish it.`);
      } catch (error) {
        showToast(error.message);
        fileInput.value = '';
      } finally {
        uploadInProgress = false;
        $('#save-copy').disabled = false;
      }
    });
    row.append(field, uploadLabel, fileInput);
    wrapper.append(caption, row);
    return wrapper;
  }

  function renderCopyForm() {
    const form = $('#copy-form');
    form.replaceChildren();
    for (const group of copyGroups) {
      const section = document.createElement('section');
      section.className = 'copy-group';
      const intro = document.createElement('div');
      const heading = document.createElement('h2');
      heading.textContent = group.title;
      const description = document.createElement('p');
      description.textContent = group.description;
      intro.append(heading, description);
      const fields = document.createElement('div');
      fields.className = 'copy-fields';
      for (const [key, label, multiline = false] of group.fields) fields.append(fieldElement(key, label, multiline));
      section.append(intro, fields);
      form.append(section);
    }
  }

  function renderProjects(filter = '') {
    const list = $('#project-list');
    const normalizedFilter = filter.trim().toLowerCase();
    const visibleProjects = projects.filter((project) => `${project.title} ${project.category}`.toLowerCase().includes(normalizedFilter));
    $('#project-count').textContent = `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`;
    list.replaceChildren();
    if (!visibleProjects.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = projects.length ? 'No projects match that search.' : 'No projects yet. Add the first one to get started.';
      list.append(empty);
      return;
    }
    for (const project of visibleProjects) {
      const row = document.createElement('article');
      row.className = 'project-row';
      const thumb = document.createElement('div');
      thumb.className = 'project-thumb';
      if (project.image_url) {
        const image = document.createElement('img');
        image.src = project.image_url;
        image.alt = '';
        image.loading = 'lazy';
        thumb.append(image);
      }
      const details = document.createElement('div');
      details.className = 'project-details';
      const title = document.createElement('h2');
      title.textContent = project.title;
      const category = document.createElement('p');
      category.textContent = `${project.category} · Order ${project.sort_order}`;
      const status = document.createElement('span');
      status.className = `project-status${project.visible ? '' : ' is-hidden'}`;
      status.textContent = project.visible ? 'Visible on website' : 'Hidden from website';
      details.append(title, category, status);
      const actions = document.createElement('div');
      actions.className = 'project-actions';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'Edit';
      edit.addEventListener('click', () => openProjectEditor(project));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Delete';
      remove.addEventListener('click', () => deleteProject(project));
      actions.append(edit, remove);
      row.append(thumb, details, actions);
      list.append(row);
    }
  }

  async function loadData() {
    const data = await request('/api/admin/data');
    settings = data.settings;
    projects = data.projects;
    renderCopyForm();
    renderProjects($('#project-search').value);
  }

  function setImagePreview(url) {
    const preview = $('#image-preview');
    const image = $('#image-preview-img');
    if (!url) {
      preview.hidden = true;
      image.removeAttribute('src');
      return;
    }
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.protocol !== 'https:' && parsed.origin !== window.location.origin) throw new Error('Invalid image source');
      image.src = parsed.href;
      preview.hidden = false;
    } catch {
      preview.hidden = true;
      image.removeAttribute('src');
    }
  }

  function openProjectEditor(project = null) {
    projectForm.reset();
    $('#project-form-message').hidden = true;
    $('#project-id').value = project?.id || '';
    $('#project-dialog-title').textContent = project ? 'Edit project' : 'Add a project';
    $('#project-title').value = project?.title || '';
    $('#project-category').value = project?.category || '';
    $('#project-order').value = project?.sort_order ?? (Math.max(0, ...projects.map((item) => item.sort_order)) + 1);
    $('#project-description').value = project?.description || '';
    $('#project-image-url').value = project?.image_url || '';
    $('#project-image-alt').value = project?.image_alt || '';
    $('#project-visible').checked = project?.visible ?? true;
    $('#project-image-file').value = '';
    $('#upload-status').textContent = 'JPG, PNG, WebP, GIF, or AVIF. Maximum 8 MB.';
    setImagePreview(project?.image_url || '');
    projectDialog.showModal();
    $('#project-title').focus();
  }

  async function deleteProject(project) {
    if (!window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return;
    try {
      await request(`/api/admin/projects/${project.id}`, { method: 'DELETE' });
      projects = projects.filter((item) => item.id !== project.id);
      renderProjects($('#project-search').value);
      showToast('Project deleted.');
    } catch (error) {
      showToast(error.message);
    }
  }

  function activateView(viewId) {
    document.querySelectorAll('.content-view').forEach((view) => { view.hidden = view.id !== viewId; });
    document.querySelectorAll('.side-link').forEach((link) => { link.classList.toggle('is-active', link.dataset.view === viewId); });
    $('#topbar-section').textContent = viewId === 'projects-view' ? 'Projects' : 'Site copy';
  }

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authMessage.hidden = true;
    const button = $('#auth-submit');
    button.disabled = true;
    try {
      const mode = authForm.dataset.mode;
      await request(`/api/admin/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ password: $('#admin-password').value })
      });
      $('#admin-password').value = '';
      setAuthenticated(true);
      await loadData();
    } catch (error) {
      showMessage(authMessage, error.message);
    } finally {
      button.disabled = false;
    }
  });

  $('#logout-button').addEventListener('click', async () => {
    try { await request('/api/admin/logout', { method: 'POST', body: '{}' }); } catch {}
    setAuthenticated(false);
    $('#admin-password').focus();
  });

  document.querySelectorAll('.side-link').forEach((link) => {
    link.addEventListener('click', () => activateView(link.dataset.view));
  });

  $('#add-project').addEventListener('click', () => openProjectEditor());
  $('#close-project-dialog').addEventListener('click', () => projectDialog.close());
  $('#cancel-project').addEventListener('click', () => projectDialog.close());
  $('#project-search').addEventListener('input', (event) => renderProjects(event.target.value));
  $('#project-image-url').addEventListener('input', (event) => setImagePreview(event.target.value.trim()));

  $('#project-image-file').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadInProgress = true;
    $('#save-project').disabled = true;
    $('#upload-status').textContent = 'Uploading image…';
    try {
      const form = new FormData();
      form.append('image', file);
      const result = await request('/api/admin/uploads', { method: 'POST', body: form });
      $('#project-image-url').value = result.url;
      $('#upload-status').textContent = 'Image uploaded. Save the project to publish it.';
      setImagePreview(result.url);
    } catch (error) {
      $('#upload-status').textContent = error.message;
      event.target.value = '';
    } finally {
      uploadInProgress = false;
      $('#save-project').disabled = false;
    }
  });

  projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (uploadInProgress) return;
    const saveButton = $('#save-project');
    const message = $('#project-form-message');
    message.hidden = true;
    saveButton.disabled = true;
    const project = {
      title: $('#project-title').value,
      category: $('#project-category').value,
      sort_order: Number($('#project-order').value),
      description: $('#project-description').value,
      image_url: $('#project-image-url').value.trim(),
      image_alt: $('#project-image-alt').value,
      visible: $('#project-visible').checked
    };
    const id = $('#project-id').value;
    try {
      const result = await request(id ? `/api/admin/projects/${id}` : '/api/admin/projects', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(project)
      });
      if (id) projects = projects.map((item) => item.id === result.project.id ? result.project : item);
      else projects.push(result.project);
      projects.sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);
      renderProjects($('#project-search').value);
      projectDialog.close();
      showToast(id ? 'Project updated.' : 'Project added.');
    } catch (error) {
      showMessage(message, error.message);
    } finally {
      saveButton.disabled = false;
    }
  });

  $('#save-copy').addEventListener('click', async () => {
    if (uploadInProgress) return showToast('Wait for the image upload to finish.');
    const form = $('#copy-form');
    const message = $('#copy-message');
    message.hidden = true;
    const changes = Object.fromEntries(new FormData(form).entries());
    const button = $('#save-copy');
    button.disabled = true;
    try {
      const result = await request('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ settings: changes }) });
      settings = result.settings;
      renderCopyForm();
      showToast('Site copy saved.');
    } catch (error) {
      showMessage(message, error.message);
    } finally {
      button.disabled = false;
    }
  });

  async function start() {
    try {
      const session = await request('/api/admin/session');
      configureAuth(session.setupRequired);
      setAuthenticated(session.authenticated);
      if (session.authenticated) await loadData();
    } catch (error) {
      configureAuth(false);
      setAuthenticated(false);
      showMessage(authMessage, `Could not reach the site manager: ${error.message}`);
    }
  }

  start();
})();