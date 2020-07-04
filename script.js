async function main() {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();

    const [gpuBuffer, arrayBuffer] = device.createBufferMapped({
        size: 4,
        usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC //We want to write to here and then copy
    });

    new Uint8Array(arrayBuffer).set([0, 1, 2, 3]); //GPU buffer is still mapped, so CPU has access, not GPU
    gpuBuffer.unmap(); //Now the GPU has access to it instead of the CPU -- note that GPUBuffer methods execute atomically and are not batched

    const gpuReadBuffer = device.createBuffer({ //Create unmapped buffer for GPU
        size: 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ //Copy to here then read it
    });

    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(gpuBuffer, 0, gpuReadBuffer, 0, 4); //Buffer a copy command
    const copyCommands = commandEncoder.finish(); //Encode the commands
    device.defaultQueue.submit([copyCommands]); //Submit to GPU for execution

    const copyBuffer = await gpuReadBuffer.mapReadAsync(); //Read buffer once commands finish executing
    console.log("Copy result:", new Uint8Array(copyBuffer));
}
main();