/* eslint-disable max-len */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { Readable } = require('stream');

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// ============================================================
// Helper: Create email transporter
// ============================================================
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: functions.config().email.user,
      pass: functions.config().email.password,
    },
  });
}

// ============================================================
// Helper: Generate PDF report as Buffer
// ============================================================
async function generatePDF(task, property, photos, checklist) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // ── HEADER ──────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill('#1e293b');
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
      .text('CleanStay Pro', 50, 25);
    doc.fontSize(10).font('Helvetica')
      .text('Reporte de Limpieza Profesional', 50, 52);
    doc.moveDown(3);

    // ── PROPERTY INFO ────────────────────────────────────────
    doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold')
      .text('Información de Propiedad', 50, 110);
    doc.moveTo(50, 128).lineTo(545, 128).strokeColor('#14b8a6').lineWidth(2).stroke();
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica').fillColor('#374151');
    doc.text(`Propiedad: ${property.nombre || '—'}`, 50);
    doc.text(`Dirección: ${property.direccion || '—'}`, 50);
    doc.text(`Propietario: ${property.propietario_nombre || '—'}`, 50);
    doc.text(`Email: ${property.propietario_email || '—'}`, 50);
    doc.moveDown(0.5);

    // ── TASK INFO ────────────────────────────────────────────
    const taskDate = task.fecha_programada
      ? task.fecha_programada.toDate().toLocaleDateString('es-ES', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
      : '—';
    doc.text(`Tipo de Limpieza: ${task.tipo || '—'}`, 50);
    doc.text(`Fecha de Servicio: ${taskDate}`, 50);
    doc.text(`Estado: ${task.estado || '—'}`, 50);
    doc.moveDown(1);

    // ── CHECKLIST ────────────────────────────────────────────
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b')
      .text('Lista de Verificación', 50);
    doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#14b8a6').lineWidth(2).stroke();
    doc.moveDown(0.5);

    const checklistItems = {
      sabanas_toallas: 'Sábanas y Toallas Cambiadas',
      amenidades: 'Amenidades Repuestas',
      basureros: 'Basureros Vaciados y Limpios',
      electrodomesticos: 'Electrodomésticos Verificados',
      reporte_danos: 'Sin Daños Reportados',
    };

    doc.fontSize(10).font('Helvetica');
    Object.entries(checklistItems).forEach(([key, label]) => {
      const checked = checklist && checklist[key];
      const symbol = checked ? '✓' : '✗';
      const color = checked ? '#16a34a' : '#dc2626';
      doc.fillColor(color).text(`${symbol} ${label}`, 60);
    });
    doc.moveDown(1);

    // ── PHOTOS SECTION ───────────────────────────────────────
    if (photos.length > 0) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b')
        .text('Evidencia Fotográfica', 50, 50);
      doc.moveTo(50, 70).lineTo(545, 70).strokeColor('#14b8a6').lineWidth(2).stroke();
      doc.moveDown(1);

      // Group photos by area
      const byArea = {};
      photos.forEach((photo) => {
        if (!byArea[photo.area]) byArea[photo.area] = { Antes: null, Después: null };
        byArea[photo.area][photo.tipo] = photo.url_storage;
      });

      doc.fontSize(10).font('Helvetica').fillColor('#374151');
      for (const [area, areaphotos] of Object.entries(byArea)) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text(area, 50);
        doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
          .text(`Antes: ${areaphotos.Antes ? '✓ Foto disponible' : 'Sin foto'}  |  Después: ${areaphotos.Después ? '✓ Foto disponible' : 'Sin foto'}`, 50);
        doc.moveDown(0.5);
      }
    }

    // ── FOOTER ───────────────────────────────────────────────
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#9ca3af')
        .text(
          `CleanStay Pro · Reporte generado el ${new Date().toLocaleDateString('es-ES')} · Página ${i + 1} de ${pageCount}`,
          50,
          doc.page.height - 30,
          { align: 'center' }
        );
    }

    doc.end();
  });
}

// ============================================================
// Cloud Function: onTaskCompleted
// Trigger: when task estado changes to "Completada"
// ============================================================
exports.onTaskCompleted = functions.firestore
  .document('tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { taskId } = context.params;

    // Only proceed if status changed to "Completada"
    if (before.estado === after.estado || after.estado !== 'Completada') {
      return null;
    }

    functions.logger.info(`Task ${taskId} completed. Generating report...`);

    try {
      // 1. Get property info
      const propertySnap = await db.doc(`properties/${after.property_id}`).get();
      const property = propertySnap.exists ? propertySnap.data() : {};

      // 2. Get photos from subcollection
      const photosSnap = await db.collection(`tasks/${taskId}/photos`).get();
      const photos = photosSnap.docs.map((d) => d.data());

      // 3. Generate PDF
      const pdfBuffer = await generatePDF(after, property, photos, after.checklist);

      // 4. Upload PDF to Storage
      const bucket = storage.bucket();
      const pdfPath = `reports/${taskId}/reporte_${Date.now()}.pdf`;
      const file = bucket.file(pdfPath);

      await file.save(pdfBuffer, {
        metadata: { contentType: 'application/pdf' },
      });
      await file.makePublic();
      const pdfUrl = `https://storage.googleapis.com/${bucket.name}/${pdfPath}`;

      // 5. Save report document
      const reportRef = await db.collection('reports').add({
        task_id: taskId,
        property_id: after.property_id,
        fecha_generacion: admin.firestore.FieldValue.serverTimestamp(),
        pdf_url: pdfUrl,
        enviado_email: false,
        cliente_email: property.propietario_email || '',
      });

      // 6. Send email if owner has email
      if (property.propietario_email) {
        const transporter = createTransporter();
        await transporter.sendMail({
          from: `CleanStay Pro <${functions.config().email.user}>`,
          to: property.propietario_email,
          subject: `✅ Reporte de Limpieza — ${property.nombre}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1e293b; padding: 24px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">CleanStay Pro</h1>
                <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Reporte de Limpieza Profesional</p>
              </div>
              <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                <p>Estimado/a <strong>${property.propietario_nombre || 'Propietario'}</strong>,</p>
                <p>Se ha completado exitosamente el servicio de limpieza en <strong>${property.nombre}</strong>.</p>
                <div style="background: #f8fafc; border-left: 4px solid #14b8a6; padding: 16px; margin: 16px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #475569;">
                    📄 Adjunto encontrará el reporte completo con evidencia fotográfica y checklist verificado.
                  </p>
                </div>
                <a href="${pdfUrl}" style="display: inline-block; background: #14b8a6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 8px 0;">
                  📥 Descargar Reporte PDF
                </a>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  CleanStay Pro · Sistema de Gestión de Limpieza para Alquileres de Corta Estancia
                </p>
              </div>
            </div>
          `,
        });

        // Update report: email sent
        await reportRef.update({ enviado_email: true });
      }

      functions.logger.info(`Report generated and email sent for task ${taskId}`);
      return null;
    } catch (error) {
      functions.logger.error(`Error processing task ${taskId}:`, error);
      throw error;
    }
  });

// ============================================================
// Cloud Function: generateReportManual
// Callable function: manually generate a report
// ============================================================
exports.generateReportManual = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { taskId } = data;
  if (!taskId) {
    throw new functions.https.HttpsError('invalid-argument', 'taskId is required');
  }

  // Get task
  const taskSnap = await db.doc(`tasks/${taskId}`).get();
  if (!taskSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Task not found');
  }
  const task = taskSnap.data();

  // Get property
  const propertySnap = await db.doc(`properties/${task.property_id}`).get();
  const property = propertySnap.exists ? propertySnap.data() : {};

  // Get photos
  const photosSnap = await db.collection(`tasks/${taskId}/photos`).get();
  const photos = photosSnap.docs.map((d) => d.data());

  // Generate PDF
  const pdfBuffer = await generatePDF(task, property, photos, task.checklist);

  // Upload PDF
  const bucket = storage.bucket();
  const pdfPath = `reports/${taskId}/reporte_manual_${Date.now()}.pdf`;
  const file = bucket.file(pdfPath);
  await file.save(pdfBuffer, { metadata: { contentType: 'application/pdf' } });
  await file.makePublic();

  const pdfUrl = `https://storage.googleapis.com/${bucket.name}/${pdfPath}`;

  // Save report
  await db.collection('reports').add({
    task_id: taskId,
    property_id: task.property_id,
    fecha_generacion: admin.firestore.FieldValue.serverTimestamp(),
    pdf_url: pdfUrl,
    enviado_email: false,
    cliente_email: property.propietario_email || '',
    manual: true,
  });

  return { success: true, pdf_url: pdfUrl };
});
