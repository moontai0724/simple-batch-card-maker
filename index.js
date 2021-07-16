document.addEventListener("DOMContentLoaded", initialize);
var vueImpl;

function initialize() {
  Vue.component("card", {
    template: document.getElementById("template-card"),
    props: {
      id: {
        type: Number,
        required: true,
      },
      content: {
        type: String,
        default: () =>
          "你好！こんにちは！Hello! Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque sit amet ligula nec dui gravida volutpat. Duis nibh metus, pulvinar et ex ut, aliquet aliquam tortor. Vestibulum id lacus ac ipsum congue auctor sed non ligula. Aenean sit amet convallis sem, vel elementum lacus. Nam nec nulla arcu. Donec eu tortor dapibus nunc aliquet efficitur. Donec dictum mauris rutrum vehicula vulputate. Integer ac dolor eget lorem sagittis finibus. Aenean quis cursus elit. Ut a arcu eu augue rutrum faucibus. Phasellus sed est lacinia, ultrices lorem quis, eleifend eros. Sed bibendum erat et metus sagittis euismod. Vivamus eget sem mollis, molestie risus quis, fermentum sem.",
      },
      image: {
        type: String,
        required: true,
      },
      width: {
        type: String,
        required: true,
      },
      padding: {
        type: Object,
        required: true,
      },
      text: {
        type: Object,
        required: true,
      },
      shadow: {
        type: Object,
        required: true,
      },
    },
    data() {
      return {
        /** @type {HTMLCanvasElement} */
        canvas: null,
        size: null,
        result: null,
        tab: null,
        config: {
          content: this.content,
          width: this.width,
          padding: this.padding,
          text: this.text,
          shadow: this.shadow,
        },
        showSetting: false,
        loaded: false,
      };
    },
    watch: {
      image() {
        this.refreshCanvas();
      },
      config: {
        handler(newConfig) {
          this.refreshCanvas();
          this.$emit("update", newConfig);
        },
        deep: true,
      },
      loaded() {
        this.$emit("loaded");
      },
    },
    mounted() {
      this.canvas = document.getElementById(`card-${this.id}`);
      this.refreshCanvas();
    },
    methods: {
      remove() {
        let confirm = window.confirm("確定要刪除？");
        if (!confirm) return;
        this.$emit("remove");
      },
      refreshCanvas() {
        let image = new Image();
        image.src = this.image;
        image.addEventListener("load", this.renderCanvas);
      },
      renderCanvas(onImageLoadEvent) {
        this.renderImage(onImageLoadEvent);
        this.renderText();
      },
      renderImage(onImageLoadEvent) {
        let image = onImageLoadEvent.target;
        let context = this.canvas.getContext("2d");
        percent = image.naturalHeight / image.naturalWidth;
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.width * percent;
        this.size = `${this.canvas.width} x ${this.canvas.height}`;
        context.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
      },
      renderText() {
        /** @type {CanvasRenderingContext2D} */
        let context = this.canvas.getContext("2d");
        // Text
        this.canvas.style[
          "letter-spacing"
        ] = `${this.config.text.letterSpacing}px`;
        context.fillStyle = this.config.text.color;
        // Shadow
        context.shadowColor = this.config.shadow.color;
        context.shadowBlur = this.config.shadow.size;
        context.shadowOffsetX = this.config.shadow.offsetX;
        context.shadowOffsetY = this.config.shadow.offsetY;

        const content = this.config.content;
        const x = this.config.padding.left;
        const y = this.config.padding.top;
        const lineHeight = this.config.text.size * this.config.text.lineHeight;
        const width =
          this.canvas.width -
          this.config.padding.left -
          this.config.padding.right;
        const height =
          this.canvas.height -
          this.config.padding.top -
          this.config.padding.top;

        CanvasTxt.align = this.config.text.align;
        CanvasTxt.vAlign = this.config.text.vAlign;
        CanvasTxt.fontSize = Number(this.config.text.size);
        CanvasTxt.font = `'Noto Sans JP', 'Noto Sans TC', 'Roboto', sans-serif`;
        CanvasTxt.lineHeight = lineHeight;
        if (Number(this.config.text.strokeSize) > 0) {
          // Stroke
          context.lineWidth = Number(this.config.text.strokeSize);
          context.strokeStyle = this.config.text.strokeColor;
          CanvasTxt.drawText(context, content, true, x, y, width, height);
          context.shadowBlur = 0;
        }

        const resultHeight = CanvasTxt.drawText(
          context,
          content,
          false,
          x,
          y,
          width,
          height
        );
        if (
          resultHeight.height >
          this.canvas.height - this.config.padding.top
        ) {
          console.log(
            "text overflow",
            resultHeight,
            this.canvas.height - this.config.padding.top
          );
          this.config.width =
            Number(this.config.width) +
            Number(resultHeight.height) -
            Number(this.canvas.height) +
            Number(this.config.padding.top) +
            "";
        } else this.loaded = true;
      },
      async download() {
        var link = document.createElement("a");
        link.download = `card-${this.id}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
      },
    },
  });

  vueImpl = new Vue({
    el: document.getElementById("app"),
    vuetify: new Vuetify(),
    data() {
      return {
        loading: false,
        processing: "載入中... 請勿切換網頁或縮小。",
        progress: 0,
        file: null,
        image: null,
        step: 1,
        defaults: {
          width: "1280",
          padding: {
            top: "100",
            right: "100",
            left: "100",
          },
          text: {
            color: "#EC46D4FF",
            size: "50",
            lineHeight: "1.5",
            letterSpacing: "0.1",
            align: "center",
            vAlign: "top",
            strokeSize: "2.25",
            strokeColor: "#EC46D4FF",
          },
          shadow: {
            color: "#39FFFFFF",
            size: "12",
            offsetX: "0",
            offsetY: "0",
          },
        },
        divider: "",
        text: "",
        cards: [],
        loadedCard: 0,
      };
    },
    watch: {
      file: function (file) {
        if (!file) return null;
        let reader = new FileReader();
        reader.addEventListener("load", () => (this.image = reader.result));
        reader.readAsDataURL(file);
      },
      loadedCard(value) {
        this.processing = `卡片載入中... (${value}/${this.cards.length}) 請勿切換網頁或縮小。`;
        this.progress = value / this.cards.length;
        if (value == this.cards.length) {
          this.loading = false;
          this.processing = "載入中... 請勿切換網頁或縮小。";
          this.progress = 0;
        }
      },
    },
    methods: {
      createCards() {
        this.step++;
        this.loading = true;
        setTimeout(() => {
          let baseId = 1;
          if (this.cards.length > 0)
            baseId += this.cards[this.cards.length - 1].id;

          this.cards.push(
            ...this.text
              .split(new RegExp(this.divider + "\\n*"))
              .map((v, index) => {
                let card = { id: baseId + index, content: v };
                Object.assign(card, JSON.parse(JSON.stringify(this.defaults)));
                return card;
              })
          );
          this.text = "";
        }, 500);
      },
      removeCard(card) {
        let index = this.cards.indexOf(card);
        this.cards.splice(index, 1);
      },
      saveConfig() {
        var link = document.createElement("a");
        link.download = `config-${Date.now()}.json`;
        link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(
          JSON.stringify({
            defaults: this.defaults,
            cards: this.cards,
          })
        )}`;
        link.click();
      },
      downloadAll() {
        this.loading = true;
        this.saveConfig();
        const elements = document.getElementsByClassName("card-canvas");
        setTimeout(() => this.batchCompress(Array.from(elements)), 200);
      },
      batchCompress(allElements, limit = 100, part = 0) {
        const zip = new JSZip();
        const step = 2 * part;
        const totalPart = Math.ceil(allElements.length / limit);
        console.log(`packing ${part} of total ${totalPart}`);

        for (
          let index = 0 + limit * part;
          index < Math.min(allElements.length, limit * (part + 1));
          index++
        ) {
          this.processing = [
            `處理第 ${index + 1} 張圖片中`,
            `(步驟 ${step + 1}/${totalPart * 2})...`,
            `請勿切換網頁或縮小。`,
          ].join(" ");
          this.progress =
            (50 * step + index / (limit * (part + 1))) / (totalPart * 2);
          zip.file(
            `card-${index + 1}.png`,
            allElements[index].toDataURL().split(";base64,").pop(),
            { base64: true }
          );
        }

        zip
          .generateInternalStream({ type: "blob" })
          .accumulate((metadata) => {
            if (
              metadata &&
              metadata.percent !== undefined &&
              metadata.percent !== 100
            ) {
              this.processing = [
                `壓縮 ${metadata.currentFile} 中`,
                `(步驟 ${step + 2}/${totalPart * 2})...`,
                `請勿切換網頁或縮小。`,
              ].join(" ");
              this.progress =
                (50 * (step + 1) + metadata.percent) / (totalPart * 2);
              return;
            }
          })
          .then((content) => {
            this.processing = "載入中... 請勿切換網頁或縮小。";
            this.progress = undefined;
            saveAs(content, `Cards-${Date.now()}-part${part + 1}.zip`);
            if (part !== totalPart - 1) {
              setTimeout(
                () => this.batchCompress(allElements, limit, ++part),
                200
              );
            } else {
              this.loading = false;
              this.processing = "載入中... 請勿切換網頁或縮小。";
              this.progress = 0;
            }
          });
      },
    },
  });
}
