interface Bildirim {
  readonly kanalAdi: string;
  gonder(mesaj: string): void;
}

type KanalTercihi = "email" | "sms" | "slack";

class EmailBildirim implements Bildirim {
  readonly kanalAdi: string = "Email";

  gonder(mesaj: string): void {
    console.log(`📧 Email -> ${mesaj}`);
  }
}

class SmsBildirim implements Bildirim {
  readonly kanalAdi: string = "SMS";

  gonder(mesaj: string): void {
    console.log(`📱 SMS -> ${mesaj}`);
  }
}

class SlackBildirim implements Bildirim {
  readonly kanalAdi: string = "Slack";

  gonder(mesaj: string): void {
    console.log(`📦 Slack -> ${mesaj}`);
  }
}

class TercihliBildirim implements Bildirim {
  private readonly kanal: Bildirim;

  constructor(tercih: KanalTercihi) {
    const kanallar: Record<KanalTercihi, Bildirim> = {
      email: new EmailBildirim(),
      sms: new SmsBildirim(),
      slack: new SlackBildirim()
    };
    this.kanal = kanallar[tercih];
  }

  get kanalAdi(): string {
    return this.kanal.kanalAdi;
  }

  gonder(mesaj: string): void {
    console.log(`Tercihli Kanal: ${this.kanalAdi}`);
    this.kanal.gonder(mesaj);
  }
}

function main(): void {
  const bildirimler: Bildirim[] = [
    new EmailBildirim(),
    new SmsBildirim(),
    new SlackBildirim()
  ];

  bildirimler.forEach((b) => {
    b.gonder("Merhaba, bu bir test mesajıdır.");
  });

  console.log("=== Tercihli Bildirim ===");

  const kullanici1 = new TercihliBildirim("email");
  kullanici1.gonder("Merhaba, bu bir test mesajıdır.");

  const kullanici2 = new TercihliBildirim("sms");
  kullanici2.gonder("Merhaba, bu bir test mesajıdır.");

  const kullanici3 = new TercihliBildirim("slack");
  kullanici3.gonder("Merhaba, bu bir test mesajıdır.");
}

main();
