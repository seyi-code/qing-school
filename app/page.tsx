import { prisma } from "@/lib/db";
import { blocksToHtml, parseBlocks } from "@/lib/cms-blocks";
import Link from "next/link";
import { SCHOOL } from "@/lib/school-config";
import { HeroSlider } from "@/components/marketing/HeroSlider";
import { MarketingNav } from "@/components/marketing/MarketingNav";

export const dynamic = "force-dynamic";

function isLive(page: { published: boolean; publishAt: Date | null }) {
  if (!page.published) return false;
  if (page.publishAt && page.publishAt.getTime() > Date.now()) return false;
  return true;
}

const HIGHLIGHTS = [
  { icon: "📚", title: "Academic Excellence", body: "Quality education for a brighter future" },
  { icon: "🛡️", title: "Strong Values", body: "Integrity, discipline and godliness" },
  { icon: "👥", title: "Supportive Community", body: "Partnership between school and home" },
  { icon: "💻", title: "Modern Facilities", body: "A safe and conducive learning environment" },
];

const PROGRAMMES = [
  {
    title: "Early Years",
    body: "A strong foundation for lifelong success.",
    img: "/kms-home/early-years.jpg",
  },
  {
    title: "Primary School",
    body: "Building confidence and curiosity.",
    img: "/kms-home/primary-school.jpg",
  },
  {
    title: "Junior Secondary",
    body: "Developing skills for a brighter future.",
    img: "/kms-home/junior-secondary.jpg",
  },
  {
    title: "Senior Secondary",
    body: "Preparing leaders and innovators.",
    img: "/kms-home/senior-secondary.jpg",
  },
];

const WHY = [
  {
    title: "Experienced Teachers",
    body: "Passionate, qualified staff who know every child.",
    icon: "💛",
  },
  {
    title: "Safe Environment",
    body: "A secure and conducive learning atmosphere.",
    icon: "🏫",
  },
  {
    title: "Modern Facilities",
    body: "Well-equipped library, labs and more.",
    icon: "✨",
  },
];

export default async function PublicHomePage() {
  let notices: Array<{ id: string; title: string; body: string; createdAt: Date }> = [];
  let homeCms: { title: string; body: string } | null = null;

  try {
    const [n, home] = await Promise.all([
      prisma.notice.findMany({
        where: { publishToWeb: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.cmsPage.findFirst({ where: { slug: "home" } }),
    ]);
    notices = n;
    if (home && isLive(home)) {
      homeCms = { title: home.title, body: home.body };
    }
  } catch (err) {
    console.error("[homepage]", err);
  }

  const cmsHtml = homeCms ? blocksToHtml(parseBlocks(homeCms.body)) : null;

  return (
    <main className="min-h-screen bg-white text-[#1e2e43]">
      <MarketingNav />
      <HeroSlider />

      <section className="bg-[#12345a] text-white">
        <div className="max-w-[1180px] mx-auto grid grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h, i) => (
            <div
              key={h.title}
              className={`flex items-center gap-3 px-4 sm:px-5 py-5 ${
                i < HIGHLIGHTS.length - 1 ? "lg:border-r border-white/20" : ""
              }`}
            >
              <span className="text-2xl sm:text-3xl text-[#f1c943] shrink-0" aria-hidden>
                {h.icon}
              </span>
              <div>
                <h3 className="text-sm font-bold m-0">{h.title}</h3>
                <p className="text-[11px] text-[#d6e0ec] m-0 mt-0.5">{h.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="py-16 sm:py-20">
        <div className="max-w-[1180px] mx-auto px-5 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div className="relative h-[280px] sm:h-[390px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kms-home/about-students.jpg"
              alt="Students of Kayvlop Magnificent School"
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute -left-2 -bottom-2 w-24 h-24 border-l-[5px] border-b-[5px] border-[#d2ae3b] rounded-bl-xl -z-10" />
          </div>
          <div>
            <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-[#a57d13]">
              About {SCHOOL.shortName}
            </p>
            <h2 className="font-serif text-[clamp(1.85rem,3.5vw,2.75rem)] leading-tight text-[#12345a] mt-2 mb-4">
              More than education.
              <br />
              <em className="not-italic text-[#b3234b]">A foundation for life.</em>
            </h2>
            <p className="text-[#627184] text-[15px] leading-relaxed">
              {SCHOOL.name} is committed to providing excellent education that equips students with
              the knowledge, skills and values to make a positive impact in their communities and the
              world.
            </p>
            <div className="flex flex-wrap gap-0 mt-5 text-[13px] font-extrabold text-[#12345a]">
              {["Academic Excellence", "Moral Integrity", "Faith", "Leadership"].map((v, i, arr) => (
                <span
                  key={v}
                  className={`px-3.5 first:pl-0 ${i < arr.length - 1 ? "border-r border-[#e3e8ed]" : ""}`}
                >
                  <span className="block text-[#d2ae3b] text-lg leading-none mb-0.5">✦</span>
                  {v}
                </span>
              ))}
            </div>
            <Link
              href="/admissions"
              className="inline-flex mt-6 items-center gap-2 px-5 py-3 rounded-lg bg-[#12345a] text-white text-sm font-extrabold hover:brightness-110"
            >
              Learn More About Us →
            </Link>
          </div>
        </div>
      </section>

      <section id="programmes" className="py-16 sm:py-20 bg-gradient-to-br from-[#f0f6fb] to-[#fbfcfd]">
        <div className="max-w-[1180px] mx-auto px-5 grid lg:grid-cols-[0.85fr_2.15fr] gap-8 items-center">
          <div>
            <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-[#a57d13]">
              Our programmes
            </p>
            <h2 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] leading-tight text-[#12345a] mt-2 mb-3">
              Holistic Education for Every Learner
            </h2>
            <p className="text-[#627184] text-sm leading-relaxed mb-5">
              We offer a balanced curriculum that combines academic excellence with character
              formation, creativity and practical skills.
            </p>
            <Link
              href="/admissions"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#12345a] text-white text-sm font-extrabold"
            >
              Explore Our Academics →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PROGRAMMES.map((p) => (
              <article
                key={p.title}
                className="bg-white border border-[#e3eaf0] rounded-xl p-3 shadow-sm min-w-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt="" className="w-full h-[100px] object-cover rounded-lg" />
                <h3 className="font-serif font-bold text-[15px] sm:text-[17px] text-[#12345a] mt-3 mb-1.5">
                  {p.title}
                </h3>
                <p className="text-[12px] text-[#627184] leading-snug m-0 mb-2">{p.body}</p>
                <Link href="/admissions" className="text-[12px] font-extrabold text-[#b3234b] hover:underline">
                  Learn More →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="why" className="py-16 sm:py-20">
        <div className="max-w-[1180px] mx-auto px-5 grid lg:grid-cols-[0.9fr_1.6fr_0.85fr] gap-6 items-stretch">
          <div className="self-center">
            <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-[#a57d13]">
              Why {SCHOOL.shortName}
            </p>
            <h2 className="font-serif text-[clamp(1.75rem,3vw,2.4rem)] leading-tight text-[#12345a] mt-2 mb-3">
              A supportive place to learn and grow
            </h2>
            <p className="text-[#627184] text-sm leading-relaxed mb-5">
              We offer a disciplined and modern learning environment where every child is valued,
              encouraged and empowered to achieve their best.
            </p>
            <Link
              href="/admissions"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#12345a] text-white text-sm font-extrabold"
            >
              Discover More →
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {WHY.map((w) => (
              <article key={w.title} className="border border-[#e3e8ed] rounded-xl p-4 bg-white">
                <span className="text-2xl text-[#d2ae3b]">{w.icon}</span>
                <h3 className="text-sm font-bold text-[#12345a] mt-2 mb-1">{w.title}</h3>
                <p className="text-xs text-[#627184] m-0 mb-2">{w.body}</p>
                <Link href="/admissions" className="text-[12px] font-extrabold text-[#b3234b]">
                  Learn More →
                </Link>
              </article>
            ))}
          </div>
          <div className="min-h-[220px] rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kms-home/why-classroom.jpg"
              alt="Classroom learning at KMS"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {cmsHtml && (
        <section className="py-12 border-t border-[#e3e8ed] bg-[#faf9f5]">
          <div className="max-w-3xl mx-auto px-5 prose prose-sm text-[#1e2e43]">
            <h2 className="font-serif text-2xl text-[#12345a]">{homeCms?.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: cmsHtml }} />
          </div>
        </section>
      )}

      <section id="news" className="py-14 bg-[#faf9f5] border-t border-[#e3e8ed]">
        <div className="max-w-[1180px] mx-auto px-5">
          <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-[#a57d13]">
            News & notices
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#12345a] mt-1 mb-6">From the school</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {notices.map((n) => (
              <article key={n.id} className="bg-white border border-[#e3e8ed] rounded-xl p-4 shadow-sm">
                <p className="text-[11px] text-[#627184]">
                  {n.createdAt.toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <h3 className="font-serif font-bold text-[#12345a] text-base mt-1">{n.title}</h3>
                <p className="text-sm text-[#627184] mt-2 line-clamp-3">{n.body}</p>
              </article>
            ))}
            {notices.length === 0 && (
              <p className="text-sm text-[#627184] col-span-full">No public notices yet.</p>
            )}
          </div>
        </div>
      </section>

      <section id="admissions-cta" className="relative bg-[#082442] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kms-home/admissions-students.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-[1] max-w-[1180px] mx-auto px-5 py-14 sm:py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-[#d2ae3b]">Admissions</p>
            <h2 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] leading-tight mt-2 mb-3">
              Join Our {SCHOOL.shortName} Family
            </h2>
            <p className="text-[#d6e0ec] text-sm sm:text-base max-w-md mb-6">
              Give your child the gift of quality education, strong values and a brighter future.
            </p>
            <Link
              href="/admissions"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#b3234b] text-white text-sm font-extrabold hover:brightness-95"
            >
              Start Your Application →
            </Link>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3 items-start">
              <span className="text-[#d2ae3b]">🎓</span>
              <span>
                <strong className="block">Admissions open</strong>
                For all classes — enquire today.
              </span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-[#d2ae3b]">📍</span>
              <span>
                <strong className="block">Visit our school</strong>
                {SCHOOL.contact.address}
              </span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-[#d2ae3b]">📞</span>
              <span>
                <strong className="block">Contact us</strong>
                <a href={`tel:${SCHOOL.contact.phone}`} className="hover:underline">
                  {SCHOOL.contact.phone}
                </a>
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-[#12345a] text-white border-t border-white/10">
        <div className="max-w-[1180px] mx-auto px-5 py-10 grid sm:grid-cols-3 gap-8">
          {[
            { title: "Parents", body: "Balances, attendance and report cards.", cta: "Parent login" },
            { title: "Students", body: "CBT exams, results and class portal.", cta: "Student login" },
            { title: "Staff & Admin", body: "Attendance, scores, fees and ops.", cta: "Staff login" },
          ].map((b) => (
            <div key={b.title}>
              <p className="font-serif text-xl text-[#f1d264]">{b.title}</p>
              <p className="text-sm text-white/70 mt-2">{b.body}</p>
              <Link href="/login" className="inline-block mt-3 text-sm font-bold text-[#f1d264] hover:underline">
                {b.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer id="contact" className="bg-[#082442] text-[#d6e0ec] pt-12 pb-6">
        <div className="max-w-[1180px] mx-auto px-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/kms-home/kms-school-crest.jpg"
                alt=""
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-contain bg-white/10"
              />
              <span className="font-serif font-bold text-white text-lg leading-tight">{SCHOOL.name}</span>
            </div>
            <p className="text-sm text-[#a8b8c9]">
              {SCHOOL.motto}. Growing minds, building character and shaping tomorrow.
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm mb-3">Quick links</h3>
            <div className="flex flex-col gap-1.5 text-sm">
              <Link href="/" className="hover:text-white">Home</Link>
              <Link href="/#about" className="hover:text-white">About Us</Link>
              <Link href="/#programmes" className="hover:text-white">Academics</Link>
              <Link href="/admissions" className="hover:text-white">Admissions</Link>
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm mb-3">More</h3>
            <div className="flex flex-col gap-1.5 text-sm">
              <Link href="/#why" className="hover:text-white">Why {SCHOOL.shortName}</Link>
              <Link href="/#news" className="hover:text-white">News & Events</Link>
              <Link href="/login" className="hover:text-white">Portal login</Link>
              <Link href="/result-checker" className="hover:text-white">Result checker</Link>
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm mb-3">Contact</h3>
            <p className="text-sm">{SCHOOL.contact.address}</p>
            <p className="text-sm mt-2">
              <a href={`tel:${SCHOOL.contact.phone}`} className="hover:text-white">
                {SCHOOL.contact.phone}
              </a>
            </p>
            <p className="text-sm">
              <a href={`mailto:${SCHOOL.contact.email}`} className="hover:text-white break-all">
                {SCHOOL.contact.email}
              </a>
            </p>
          </div>
        </div>
        <div className="max-w-[1180px] mx-auto px-5 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-2 justify-between text-xs text-[#8a9aab]">
          <span>
            © {new Date().getFullYear()} {SCHOOL.name}. All rights reserved.
          </span>
          <strong className="text-[#d2ae3b] font-semibold">Knowledge · Character · Service</strong>
        </div>
      </footer>
    </main>
  );
}
