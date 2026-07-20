interface Bildirim {
  kanalAdi: string;
  gonder(mesaj: string): void;
}


class EmailBildirim implements Bildirim {
    kanalAdi: string = "Email";
    gonder(mesaj: string): void {
        console.log(`📧 Email -> ${mesaj}`);
    }
}

class SmsBildirim implements Bildirim {
    kanalAdi: string = "SMS";
    gonder(mesaj: string): void {
  console.log(`📱 SMS -> ${mesaj}`);
}
    }

class SlackBildirim implements Bildirim {
    kanalAdi: string = "Slack";
    gonder(mesaj: string): void {
        console.log(`📦 Slack -> ${mesaj}`);
    }
}

class TercihliBildirim implements Bildirim {
    kanalAdi: string;
    private tercihEdilenKanal: Bildirim;

    constructor(tercihEdilenKanal: Bildirim) {
        this.tercihEdilenKanal = tercihEdilenKanal;
        this.kanalAdi = tercihEdilenKanal.kanalAdi;
    }

    gonder(mesaj: string): void {
        console.log(`Tercihli Kanal: ${this.kanalAdi}`);
        this.tercihEdilenKanal.gonder(mesaj);
    }
}
function main() {
  const bildirimler: Bildirim[] = [
    new EmailBildirim(),
    new SmsBildirim(),
    new SlackBildirim()
  ];
  bildirimler.forEach((b) => {
    b.gonder("Merhaba, bu bir test mesajıdır.");
  });

  console.log("=== Tercihli Bildirim ===");

  const kullanici1 = new TercihliBildirim(new EmailBildirim());
  kullanici1.gonder("Merhaba, bu bir test mesajıdır.");

  const kullanici2 = new TercihliBildirim(new SmsBildirim());
  kullanici2.gonder("Merhaba, bu bir test mesajıdır.");

  const kullanici3 = new TercihliBildirim(new SlackBildirim());
  kullanici3.gonder("Merhaba, bu bir test mesajıdır.");
}

main();