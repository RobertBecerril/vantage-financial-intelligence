"use client";

import { useMemo, useState } from "react";

const watches = [
  {
    id: 1,
    brand: "Rolex",
    model: "Datejust 36",
    reference: "126234",
    price: 9500,
    marketChange: 2.4,
    volume: "High",
    caseSize: "36mm",
    dialColor: "Blue",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    brand: "Omega",
    model: "Aqua Terra",
    reference: "220.10.41.21.03.001",
    price: 5200,
    marketChange: -1.1,
    volume: "Medium",
    caseSize: "41mm",
    dialColor: "Blue",
    image:
      "https://images.unsplash.com/photo-1539874754764-5a96559165b0?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    brand: "Cartier",
    model: "Santos",
    reference: "WSSA0029",
    price: 7300,
    marketChange: 4.8,
    volume: "High",
    caseSize: "39.8mm",
    dialColor: "White",
    image:
      "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    brand: "Tudor",
    model: "Black Bay 58",
    reference: "M79030N",
    price: 3900,
    marketChange: -0.6,
    volume: "Low",
    caseSize: "39mm",
    dialColor: "Black",
    image:
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");

  const brands = ["All", ...Array.from(new Set(watches.map((w) => w.brand)))];

  const filteredWatches = useMemo(() => {
    return watches.filter((watch) => {
      const matchesSearch =
        watch.brand.toLowerCase().includes(search.toLowerCase()) ||
        watch.model.toLowerCase().includes(search.toLowerCase()) ||
        watch.reference.toLowerCase().includes(search.toLowerCase());

      const matchesBrand = brand === "All" || watch.brand === brand;

      return matchesSearch && matchesBrand;
    });
  }, [search, brand]);

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-[#d6b46a]/10 bg-black/80 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="text-3xl font-light tracking-[0.5em] text-[#d6b46a]">
            LUME
          </div>

          <div className="hidden gap-10 text-sm text-zinc-400 md:flex">
            <a className="hover:text-[#d6b46a]" href="#">Discover</a>
            <a className="hover:text-[#d6b46a]" href="#">Compare</a>
            <a className="hover:text-[#d6b46a]" href="#">Market</a>
            <a className="hover:text-[#d6b46a]" href="#">AI Search</a>
            <a className="hover:text-[#d6b46a]" href="#">Watchlist</a>
          </div>

          <button className="rounded-xl border border-[#d6b46a] px-6 py-2 text-sm text-[#d6b46a] transition hover:bg-[#d6b46a] hover:text-black">
            Join Waitlist
          </button>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-14 px-6 py-20 md:grid-cols-2">
        <div>
          <p className="mb-5 text-sm uppercase tracking-[0.3em] text-[#d6b46a]">
            AI Watch Discovery
          </p>

          <h1 className="text-6xl font-semibold leading-tight md:text-7xl">
            Discover your next{" "}
            <span className="bg-gradient-to-r from-[#d6b46a] to-[#f5e6b3] bg-clip-text text-transparent">
              grail watch.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
            Lume helps collectors identify watches, compare alternatives, track
            market trends, and find smarter luxury watch picks using AI.
          </p>

          <div className="mt-8 flex gap-4">
            <button className="rounded-full bg-[#d6b46a] px-7 py-3 font-medium text-black transition hover:bg-[#f5d983]">
              Explore Watches →
            </button>
            <button className="rounded-full border border-zinc-700 px-7 py-3 font-medium text-zinc-200 transition hover:border-[#d6b46a] hover:text-[#d6b46a]">
              Upload Watch Photo
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#d6b46a]/30 bg-zinc-950 p-4 shadow-2xl shadow-[#d6b46a]/10">
          <img
            src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1400&auto=format&fit=crop"
            alt="Rolex Datejust"
            className="h-[500px] w-full rounded-[1.5rem] object-cover"
          />
          <div className="p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-[#d6b46a]">
              Featured
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Rolex Datejust 36</h2>
            <p className="mt-1 text-zinc-400">
              AI matched with 12 similar alternatives.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#d6b46a]">
              Market Intelligence
            </p>
            <h2 className="mt-3 text-4xl font-semibold">Explore watches</h2>
            <p className="mt-3 max-w-xl text-zinc-400">
              Search by brand, model, or reference number.
            </p>
          </div>

          <div className="flex gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Rolex, Santos..."
              className="rounded-full border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-[#d6b46a]"
            />

            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="rounded-full border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm outline-none focus:border-[#d6b46a]"
            >
              {brands.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredWatches.map((watch) => (
            <div
              key={watch.id}
              className="group rounded-3xl border border-[#d6b46a]/20 bg-zinc-950 p-4 transition hover:-translate-y-1 hover:border-[#d6b46a] hover:shadow-2xl hover:shadow-[#d6b46a]/10"
            >
              <img
                src={watch.image}
                alt={`${watch.brand} ${watch.model}`}
                className="h-56 w-full rounded-2xl object-cover transition duration-500 group-hover:scale-[1.02]"
              />

              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.25em] text-[#d6b46a]">
                  {watch.brand}
                </p>

                <h3 className="mt-2 text-xl font-semibold">{watch.model}</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Ref. {watch.reference}
                </p>

                <p className="mt-4 inline-block rounded-xl border border-[#d6b46a]/40 px-4 py-2 text-lg">
                  ${watch.price.toLocaleString()}
                </p>

                <div className="mt-4 rounded-2xl border border-[#d6b46a]/20 bg-black p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          watch.marketChange >= 0
                            ? "bg-green-400"
                            : "bg-red-400"
                        }`}
                      />
                      <p className="text-xs font-medium uppercase">
                        Live Market
                      </p>
                    </div>

                    <p
                      className={`text-sm font-semibold ${
                        watch.marketChange >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {watch.marketChange >= 0 ? "▲ +" : "▼ "}
                      {watch.marketChange}%
                    </p>
                  </div>

                  <div className="mt-4 flex h-20 items-center justify-center rounded-2xl bg-zinc-950">
                    <span
                      className={`text-7xl font-black text-[#d6b46a] drop-shadow-[0_0_14px_rgba(214,180,106,0.9)] transition group-hover:scale-110 ${
                        watch.marketChange >= 0 ? "-rotate-45" : "rotate-45"
                      }`}
                    >
                      ➜
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between text-xs text-zinc-500">
                    <span>Market Volume</span>
                    <span
                      className={
                        watch.volume === "High"
                          ? "text-green-400"
                          : watch.volume === "Low"
                          ? "text-red-400"
                          : "text-[#d6b46a]"
                      }
                    >
                      {watch.volume}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="border-r border-zinc-800">
                    <p className="text-zinc-500">Case Size</p>
                    <p>{watch.caseSize}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Dial</p>
                    <p>{watch.dialColor}</p>
                  </div>
                </div>

                <button className="mt-5 w-full rounded-xl border border-[#d6b46a]/50 py-3 text-[#d6b46a] transition hover:bg-[#d6b46a] hover:text-black">
                  View Intelligence →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}