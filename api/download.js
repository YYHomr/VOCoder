import AdmZip from 'adm-zip';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { files } = req.body;
  const zip = new AdmZip();

  files.forEach(file => {
    zip.addFile(file.path, Buffer.from(file.content, 'utf8'));
  });

  const zipBuffer = zip.toBuffer();
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=generated-app.zip');
  res.send(zipBuffer);
}
