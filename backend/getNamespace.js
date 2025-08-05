const common = require("oci-common");
const objectStorage = require("oci-objectstorage");

const provider = new common.ConfigFileAuthenticationDetailsProvider();

const client = new objectStorage.ObjectStorageClient({
  authenticationDetailsProvider: provider,
  region: "eu-frankfurt-1",
});

async function getNamespace() {
  try {
    const response = await client.getNamespace({});
    console.log("✅ Namespace:", response.value);
  } catch (err) {
    console.error("❌ Error getting namespace:", err);
  }
}

getNamespace();
