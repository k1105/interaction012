import dynamic from "next/dynamic";
import p5Types from "p5";
import { MutableRefObject } from "react";
import { Hand } from "@tensorflow-models/hand-pose-detection";
import { getSmoothedHandpose } from "../lib/getSmoothedHandpose";
import { updateHandposeHistory } from "../lib/updateHandposeHistory";
import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { convertHandToHandpose } from "../lib/converter/convertHandToHandpose";
import { dotHand } from "../lib/p5/dotHand";
import { lineHand } from "../lib/p5/lineHand";
import { giftwrap } from "../lib/calculator/giftwrap";

type Props = {
  handpose: MutableRefObject<Hand[]>;
};

type Handpose = Keypoint[];

const Sketch = dynamic(import("react-p5"), {
  loading: () => <></>,
  ssr: false,
});

export const HandSketch = ({ handpose }: Props) => {
  let handposeHistory: {
    left: Handpose[];
    right: Handpose[];
  } = { left: [], right: [] };

  const preload = (p5: p5Types) => {
    // 画像などのロードを行う
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.stroke(220);
    p5.fill(255);
    p5.strokeWeight(10);
  };

  const draw = (p5: p5Types) => {
    const rawHands: {
      left: Handpose;
      right: Handpose;
    } = convertHandToHandpose(handpose.current); //平滑化されていない手指の動きを使用する
    handposeHistory = updateHandposeHistory(rawHands, handposeHistory); //handposeHistoryの更新
    const hands: {
      left: Handpose;
      right: Handpose;
    } = getSmoothedHandpose(rawHands, handposeHistory); //平滑化された手指の動きを取得する

    p5.background(1, 25, 96);
    if (hands.left.length > 0 || hands.right.length > 0) {
      if (hands.left.length == 0) {
        hands.left = hands.right;
      } else if (hands.right.length == 0) {
        hands.right = hands.left;
      }
    }

    const lineLength = 50;

    [hands.left, hands.right].forEach((hand, index) => {
      if (hand.length > 0) {
        p5.push(); //0

        p5.translate(
          p5.width / 2 - lineLength * 5,
          window.innerHeight / 2 + 300
        );

        let start;
        let end;

        for (let n = 0; n < 5; n++) {
          start = 4 * n + 1;
          end = 4 * n + 4;
          const d = Math.min(
            Math.max((hand[start].y - hand[end].y) / 50, 0),
            Math.PI / 2
          );
          p5.translate(lineLength * 2, 0);
          p5.push(); //1
          p5.push(); //2
          p5.translate(0, -lineLength * Math.sin(d));
          for (let i = 0; i < 5; i++) {
            p5.push(); //3
            p5.rotate((-1) ** index * d);
            p5.line(-lineLength, 0, lineLength, 0);
            p5.pop(); //3
            p5.translate(0, -lineLength * 2 * Math.sin(d));
          }
          p5.pop(); //2
          p5.pop(); //1
        }

        p5.pop(); //0
      }
    });
  };

  const windowResized = (p5: p5Types) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  return (
    <>
      <Sketch
        preload={preload}
        setup={setup}
        draw={draw}
        windowResized={windowResized}
      />
    </>
  );
};
