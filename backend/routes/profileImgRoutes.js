// profileImgRoutes.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const oci = require("oci-sdk");
const authenticateToken = require("../middleware/authMiddleware");
const { executeQuery } = require("../db");

const router = express.Router();
const uploadDir = "uploads";

// Create temp folder if not exists
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer setup
const upload = multer({ dest: uploadDir });

// OCI setup
const provider = new oci.common.ConfigFileAuthenticationDetailsProvider();
const objectStorageClient = new oci.objectstorage.ObjectStorageClient({
  authenticationDetailsProvider: provider,
});

const namespaceName = process.env.NAMESPACE;
const bucketName = process.env.PHOTO_BUCKET;

// ================= UPLOAD PROFILE IMAGE =================
router.post(
  "/upload",
  authenticateToken,
  upload.single("profileImage"),
  async (req, res) => {
    const file = req.file;
    const userId = req.user.id;

    if (!file) {
      return res
        .status(400)
        .json({ message: "Fișier imagine este obligatoriu." });
    }

    try {
      // 🔹 Delete old image if exists
      const result = await executeQuery(
        `SELECT imagine_profil FROM utilizator WHERE id_utilizator = :id`,
        { id: userId },
      );

      if (result.length > 0 && result[0].IMAGINE_PROFIL) {
        const oldUrl = result[0].IMAGINE_PROFIL;
        const oldObjectName = oldUrl.split("/").pop();
        try {
          await objectStorageClient.deleteObject({
            namespaceName,
            bucketName,
            objectName: `profile-images/${oldObjectName}`,
          });
        } catch (deleteErr) {
          console.warn("Nu am putut șterge imaginea veche:", deleteErr.message);
        }
      }

      // 🔹 Upload new image
      const objectName = `profile-images/${userId}_${file.originalname}`;
      await objectStorageClient.putObject({
        namespaceName,
        bucketName,
        objectName,
        putObjectBody: fs.createReadStream(file.path),
        contentLength: fs.statSync(file.path).size,
      });

      // 🔹 Pre-signed URL
      const { preauthenticatedRequest } =
        await objectStorageClient.createPreauthenticatedRequest({
          namespaceName,
          bucketName,
          createPreauthenticatedRequestDetails: {
            name: `profile-img-${userId}-${Date.now()}`,
            accessType: "ObjectRead",
            timeExpires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
            objectName,
          },
        });

      const preSignedUrl = `https://objectstorage.eu-frankfurt-1.oraclecloud.com${preauthenticatedRequest.accessUri}`;

      // 🔹 Save URL in DB
      await executeQuery(
        `UPDATE utilizator SET imagine_profil = :url WHERE id_utilizator = :id`,
        { url: preSignedUrl, id: userId },
      );

      res.json({
        message: "Imagine profil încărcată cu succes!",
        url: preSignedUrl,
      });
    } catch (err) {
      console.error("Eroare upload imagine profil:", err);
      res.status(500).json({ message: "Eroare la încărcarea imaginii." });
    } finally {
      // Remove temp file
      fs.unlink(file.path, (err) => {
        if (err) console.error("Eroare ștergere temp:", err);
      });
    }
  },
);

module.exports = router;
