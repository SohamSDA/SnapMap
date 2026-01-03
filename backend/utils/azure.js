import {BlobServiceClient} from "@azure/storage-blob"

const CONTAINER_NAME = "snapmap-blob"

async function uploadToAzure(buffer, fileName) {
    if(!buffer || !fileName)
        throw new error("Buffer and Filename are required")

    if(!process.env.AZURE_STORAGE_CONNECTION)
        throw new error("Connection string is required")


    const blobServiceClient = BlobServiceClient.fromConnectionString(         
        process.env.AZURE_STORAGE_CONNECTION                                    // 1. Create a Service Client
    )

    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME)  // 2. Get Container Client

    await containerClient.createIfNotExists({                                   // 3. Create Container Client if not exists
        access: "blob",
    })

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);       // 4. Create Blob Client
    await blockBlobClient.uploadData(buffer);                                   // 5. Upload Buffer
    return blockBlobClient.url

}

export default uploadToAzure