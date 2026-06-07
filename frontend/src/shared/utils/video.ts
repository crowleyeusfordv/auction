/**
 * Extrai um frame de um arquivo de vídeo como uma imagem (File)
 * @param file Arquivo de vídeo (.mp4, etc)
 * @param seekTime Em qual segundo extrair a thumbnail (default: 1 segundo)
 * @returns Um objeto File representando a imagem JPEG extraída
 */
export function extractVideoFrame(file: File, seekTime = 1): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return reject(new Error('当前浏览器不支持 Canvas。'));
    }

    // Carregar o arquivo local como URL
    video.src = URL.createObjectURL(file);
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true; // Necessário para alguns navegadores não bloquearem autoplay/seek invisível

    // Quando os metadados carregarem (tamanho, duração), pulamos para o tempo desejado
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      // Evita tentar pular além da duração do vídeo
      video.currentTime = Math.min(seekTime, video.duration);
    };

    // Quando o vídeo conseguir pular para o tempo especificado
    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(video.src); // Limpar memória
        if (!blob) {
          return reject(new Error('生成视频封面失败。'));
        }

        const fileName = `${file.name.replace(/\.[^/.]+$/, '')}_thumb.jpg`;
        const imageFile = new File([blob], fileName, { type: 'image/jpeg' });
        resolve(imageFile);
      }, 'image/jpeg', 0.8);
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(video.src);
      reject(e);
    };
  });
}
