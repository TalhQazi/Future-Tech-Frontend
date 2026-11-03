// Integration client directly connected to Centralized Task Manager API
// Endpoint specification from Task Manager External Bug Ingestion Guide.

const TASK_MANAGER_API = (import.meta.env.VITE_TASK_MANAGER_API_URL || 'https://task.se7eninc.com').replace(/\/$/, '');

export const bugsApi = {
  // Upload attachments directly to Task Manager storage
  uploadFiles: async (fileList) => {
    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) {
      formData.append('files', fileList[i]);
    }
    const res = await fetch(`${TASK_MANAGER_API}/api/bugs/external/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || `File upload failed (${res.status})`);
    }
    const data = await res.json();
    return data.items || data.files || [];
  },

  // Submit bug report directly to Task Manager External Ingestion Endpoint
  create: async (data) => {
    const payload = {
      websiteName: 'FutureTech OS',
      websiteUrl: window.location.origin,
      pageUrl: window.location.href,
      title: data.title,
      description: data.description,
      severity: (data.severity || 'medium').toLowerCase(),
      priority: (data.priority || 'medium').toLowerCase(),
      module: data.module || 'General',
      reporterName: data.reporterName || 'FutureTech User',
      reporterEmail: data.reporterEmail || '',
      taskId: data.taskId || undefined,
      browserInfo: {
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        platform: navigator.platform,
        language: navigator.language
      },
      attachments: (data.attachments || []).map(att => ({
        fileName: att.fileName || att.name || 'attachment',
        url: att.url || '',
        mimeType: att.mimeType || att.fileType || '',
        size: Number(att.size || 0),
        duration: Number(att.duration || 0),
        checksum: att.checksum || ''
      }))
    };

    const res = await fetch(`${TASK_MANAGER_API}/api/bugs/external`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error?.message || body?.message || `Failed to report bug (${res.status})`);
    }

    return body.bug || body.item || body;
  }
};

export default bugsApi;
