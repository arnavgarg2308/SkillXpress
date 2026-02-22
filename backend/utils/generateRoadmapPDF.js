const PDFDocument = require("pdfkit");

async function generateAndUploadPDF(supabase, content, userId, month) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      const filePath = `${userId}/roadmap-month-${month}.pdf`;

      const { error } = await supabase.storage
        .from("roadmaps") // bucket name
        .upload(filePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true
        });

      if (error) return reject(error);

      const { data } = supabase.storage
        .from("roadmaps")
        .getPublicUrl(filePath);

      resolve(data.publicUrl);
    });

    doc.fontSize(18).text("Monthly Roadmap", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(content);
    doc.end();
  });
}

module.exports = generateAndUploadPDF;