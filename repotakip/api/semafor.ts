// Ayni anda en fazla `limit` kadar isin calismasina izin veren basit bir kuyruk.
// Limit dolunca yeni gelen isler, bir yer bosalana kadar bekler.
export class Semafor {
  private aktif = 0;
  private bekleyenler: (() => void)[] = [];

  constructor(private readonly limit: number) {}

  async calistir<T>(is: () => Promise<T>): Promise<T> {
    if (this.aktif >= this.limit) {
      await new Promise<void>((resolve) => this.bekleyenler.push(resolve));
    }

    this.aktif++;
    try {
      return await is();
    } finally {
      this.aktif--;
      const sonraki = this.bekleyenler.shift();
      if (sonraki) {
        sonraki();
      }
    }
  }
}
