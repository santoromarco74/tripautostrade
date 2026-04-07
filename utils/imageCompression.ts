import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Ridimensiona e comprime un'immagine prima dell'upload.
 * Max 1200px di larghezza, JPEG al 70% — produce file ~200-300KB.
 */
export async function compressImage(
  uri: string,
): Promise<{ uri: string; base64: string }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  return { uri: result.uri, base64: result.base64! };
}
