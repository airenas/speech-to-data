import { TranscriptionSegment } from '@/components/Audio/types';

export class ListTranscriptionSegment implements TranscriptionSegment {
  constructor(
    public segment: number,
    public transcript: string,
    public final: boolean,
  ) {}
}

export class TranscriptionResult {
  segments: TranscriptionSegment[];
  partial: string;

  constructor() {
    this.segments = [];
    this.partial = '';
  }

  addSegment(text: string, id: number) {
    this.segments.push(new ListTranscriptionSegment(id, text, true));
  }

  updatePartial(text: string) {
    this.partial = text;
  }

  getFullTranscription(): string {
    let text = '';
    this.segments.forEach((segment, _) => {
      const s = segment.transcript;
      let so = s;
      if (!(s.length > 1 && s.charAt(s.length - 1) === '\n')) {
        so = `${s} `;
      }
      text += so;
    });
    if (this.partial !== '') {
      text += this.partial;
    }
    return text;
  }

  updateSegments(segments?: TranscriptionSegment[]) {
    if (segments !== null && segments !== undefined && segments.length > 0) {
      for (const segment of segments) {
        let found = false;
        for (const s of this.segments) {
          if (s.segment === segment.segment) {
            s.final = segment.final;
            s.transcript = segment.transcript;
            found = true;
            break;
          }
        }
        if (!found) {
          console.warn('missed segment:', segment.segment);
        }
      }
    }
  }
}

//   function getText (pageData) {
//     let text = ''
//     pageData.res.forEach((segment, index) => {
//       if (index < pageData.skip) {
//         return
//       }
//       const s = segment.transcript
//       let so = s
//       if (!(s.length > 1 && s.charAt(s.length - 1) === '\n')) {
//         so = `${s} `
//       }
//       text += so
//     })
//     if (pageData.partials !== '') {
//       text += pageData.partials
//     }
//     return text
//   }

//   function getOldText (pageData) {
//     if (pageData.skip === 1) {
//       return pageData.res[0] + '\n'
//     }
//     return ''
//   }

//   function updateRes (pageData) {
//     const text = getText(pageData)
//     pageData.recordArea.setText(getOldText(pageData) + text)
//   }

//   function updateSegments (pageData, segments) {
//     if (segments !== null && segments !== undefined && segments.length > 0) {
//       // console.debug('old segments:', segments)
//       for (const segment of segments) {
//         let found = false
//         for (const s of pageData.res) {
//           if (s.segment === segment.segment) {
//             s.final = segment.final
//             s.transcript = segment.transcript
//             console.debug('updated segment:', s.segment)
//             found = true
//             break
//           }
//         }
//         if (!found) {
//           console.warn('missed segment:', segment.segment)
//         }
//       }
//     }
//   }

//   function addSegment (pageData, text, id) {
//     console.log('addSegment', id)
//     pageData.res.push(new SpeechSegment(id, text, true))
