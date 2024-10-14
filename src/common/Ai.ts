export default async function jsonConfig(
    source_image: string,
    target_image: string
) {
    return {
        input: {
            source_image: source_image,
            target_image: target_image,
            source_indexes: "-1",
            target_indexes: "1",
            background_enhance: false,
            face_restore: true,
            face_upsample: true,
            upscale: 1,
            codeformer_fidelity: 0.5,
            output_format: "JPEG",
        },
    };
}
