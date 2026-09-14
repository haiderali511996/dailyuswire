"""Seed the site with starter articles so every page renders fully populated.

Run once after `uvicorn app.main:app` has created the database:

    python seed_demo.py --covers ./covers

These are original evergreen explainers written to be genuinely useful, not
filler. Replace or expand them with your own reporting as you build the archive.
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.bootstrap import run as bootstrap_run
from app.database import SessionLocal
from app.models import Category, Media, Post, PostImage, PostStatus, User
from app.services.posts import (
    apply_content,
    apply_seo_defaults,
    ensure_slug,
    resolve_tags,
)
from app.utils.images import save_image

MIME_BY_SUFFIX = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}


def p(*paragraphs: str) -> str:
    return "".join(paragraphs)


def h2(text: str) -> str:
    return f"<h2>{text}</h2>"


ARTICLES: list[dict] = [
    {
        "category": "news",
        "title": "How a Federal Government Shutdown Actually Works - and Who Feels It First",
        "focus_keyword": "government shutdown",
        "excerpt": "When Congress misses a funding deadline, the government does not simply switch off. Here is the mechanism, the exemptions, and who stops being paid on day one.",
        "meta_title": "How a Government Shutdown Works and Who It Affects First",
        "meta_description": "A plain-English guide to federal government shutdowns: what triggers one, which agencies keep running, who gets furloughed, and how back pay works.",
        "tags": ["Congress", "Federal Budget", "Explainer"],
        "content": p(
            "<p>A federal shutdown is not a switch that turns Washington off. It is the legal consequence of a specific failure: Congress has not enacted appropriations, and the Antideficiency Act forbids agencies from spending money they have not been given. What follows is a carefully choreographed partial stop.</p>",
            h2("What actually triggers a shutdown"),
            "<p>Federal spending runs on a fiscal year beginning October 1. Congress is meant to pass twelve appropriations bills before then. When it does not, it usually passes a continuing resolution that extends the previous year's funding. A shutdown begins when neither happens and the clock runs out.</p>",
            "<p>Critically, a shutdown is not a default. The government still pays interest on its debt. Programmes funded by permanent law rather than annual appropriations, including Social Security benefits and Medicare, keep sending payments.</p>",
            h2("Excepted versus exempt: the distinction that matters"),
            "<p>Agencies sort staff into three groups. <strong>Exempt</strong> employees are paid from funding that does not lapse. <strong>Excepted</strong> employees work without pay because their duties protect life or property - air traffic controllers, federal law enforcement, active-duty military. Everyone else is <strong>furloughed</strong> and legally barred from working, including from checking email.</p>",
            "<p>The Government Employee Fair Treatment Act of 2019 guarantees back pay to both furloughed and excepted federal employees once funding resumes. It does not cover the contractors who clean federal buildings, staff cafeterias or run IT helpdesks. That group frequently never recovers the lost income.</p>",
            h2("Who feels it in the first 72 hours"),
            "<ul>"
            "<li><strong>Federal contractors.</strong> Work orders stop immediately and back pay is not guaranteed.</li>"
            "<li><strong>Anyone needing a federal permit or approval.</strong> New passport processing slows, IPO reviews at the SEC pause, and small business loan approvals stall.</li>"
            "<li><strong>National parks and museums.</strong> Gates close or go unstaffed, hitting the local economies around them within days.</li>"
            "<li><strong>Economic data users.</strong> The Bureau of Labor Statistics stops publishing, which means the Federal Reserve and markets lose their normal read on jobs and inflation.</li>"
            "</ul>",
            h2("What does not stop"),
            "<p>Mail delivery continues - the Postal Service is self-funded. Social Security and Medicare payments go out. The military stays deployed, though paychecks can be delayed if the lapse extends past a pay period. Federal courts run on filing fees and reserve funds for roughly two to three weeks before they too must triage.</p>",
            h2("The economic cost"),
            "<p>The Congressional Budget Office estimated that the 35-day lapse ending in January 2019 permanently cost the US economy about $3 billion in output that was never recovered, on top of $8 billion in delayed activity. Most of the temporary loss returns once workers are paid; the permanent share reflects business that simply never happened.</p>",
            h2("How shutdowns end"),
            "<p>Almost always the same way: political pressure builds until one side accepts a deal it previously rejected, usually a short continuing resolution that defers the underlying dispute. The structural problem - twelve separate bills, a hard deadline, and a Senate that needs sixty votes - remains untouched.</p>",
            '<p>For the authoritative rules, see the <a href="https://www.whitehouse.gov/omb/information-for-agencies/agency-contingency-plans/" target="_blank" rel="noopener noreferrer">agency contingency plans published by the Office of Management and Budget</a>.</p>',
        ),
    },
    {
        "category": "health",
        "title": "What the Evidence Actually Says About Sleep and Long-Term Health",
        "focus_keyword": "sleep and health",
        "excerpt": "Short sleep is linked to almost every chronic disease. Separating what the research demonstrates from what it merely correlates with changes what you should do about it.",
        "meta_title": "Sleep and Health: What the Research Really Shows",
        "meta_description": "An evidence-based look at how sleep duration and quality affect heart disease, metabolism, immunity and cognition - and which interventions have the strongest support.",
        "tags": ["Sleep", "Preventive Health", "Research"],
        "content": p(
            "<p>Sleep research has a credibility problem: the headline findings are dramatic, the underlying studies are mostly observational, and the gap between the two is where bad advice grows. Here is what holds up.</p>",
            h2("The dose-response curve is U-shaped, not linear"),
            "<p>Large pooled analyses consistently find the lowest all-cause mortality at roughly seven hours of sleep per night, with risk rising on both sides. That does not mean sleeping nine hours causes harm. Long sleep is a well-documented marker of undiagnosed illness, depression and sleep-disordered breathing, which is the more likely explanation for the right-hand side of the curve.</p>",
            h2("Where the causal evidence is strongest"),
            "<ul>"
            "<li><strong>Metabolic function.</strong> Controlled laboratory restriction studies show measurable reductions in insulin sensitivity after only a few nights of four to five hours. This is experimental, not correlational.</li>"
            "<li><strong>Blood pressure.</strong> Sleep restriction raises overnight blood pressure and sympathetic activity in randomised crossover designs.</li>"
            "<li><strong>Cognitive performance.</strong> Reaction time, working memory and error rates degrade predictably with accumulated sleep debt, and people systematically underestimate their own impairment.</li>"
            "<li><strong>Immune response.</strong> Trials have shown reduced antibody response to vaccination in sleep-restricted participants.</li>"
            "</ul>",
            h2("Where it is weaker than the headlines suggest"),
            "<p>The link between short sleep and dementia is real in cohort data but confounded by reverse causation: neurodegeneration disrupts sleep years before diagnosis. The same caution applies to much of the cancer literature. These findings justify further study; they do not justify alarm.</p>",
            h2("Quality versus duration"),
            "<p>Time in bed is the easiest thing to measure and the least informative. Sleep efficiency - the proportion of time in bed actually spent asleep - and continuity matter more. Fragmented seven-hour sleep is not equivalent to consolidated seven-hour sleep, and consumer wearables estimate sleep stages far less reliably than their interfaces imply.</p>",
            h2("Interventions ranked by evidence"),
            "<ol>"
            "<li><strong>Cognitive behavioural therapy for insomnia (CBT-I).</strong> The strongest evidence base of any intervention, and recommended as first-line treatment ahead of medication by major clinical guidelines.</li>"
            "<li><strong>A consistent wake time.</strong> Anchoring the morning does more for circadian stability than adjusting bedtime.</li>"
            "<li><strong>Morning daylight exposure.</strong> Well supported for phase-shifting the circadian clock.</li>"
            "<li><strong>Screening for sleep apnoea.</strong> Substantially underdiagnosed, and treatable. Loud snoring with daytime sleepiness warrants a clinical conversation.</li>"
            "<li><strong>Limiting alcohol near bedtime.</strong> It shortens sleep latency but reliably fragments the second half of the night.</li>"
            "</ol>",
            "<p><em>This article is journalism, not medical advice. Persistent sleep problems should be discussed with a physician.</em></p>",
        ),
    },
    {
        "category": "sports",
        "title": "The Analytics Revolution Reshaping How American Teams Are Built",
        "focus_keyword": "sports analytics",
        "excerpt": "Front offices no longer argue about whether data works. The interesting fight now is over which data, measured how, and how much a coach should be allowed to override it.",
        "meta_title": "How Sports Analytics Changed Team Building in the NFL, NBA and MLB",
        "meta_description": "From expected goals to load management, a clear look at how analytics reshaped roster construction and in-game decisions across American professional sport.",
        "tags": ["Analytics", "NFL", "NBA", "MLB"],
        "content": p(
            "<p>Two decades after <em>Moneyball</em>, every professional franchise in North America employs analysts. The competitive edge has moved from having the data to knowing which parts of it are actually predictive.</p>",
            h2("Baseball: from on-base percentage to biomechanics"),
            "<p>The original arbitrage - undervalued on-base skills - closed within a few seasons. What replaced it is measurement of the pitch itself: spin rate, spin axis, seam-shifted wake, and release consistency. Development staff now rebuild a pitcher's arsenal from a high-speed camera rig rather than a scouting report.</p>",
            h2("Basketball: the geometry of the shot chart"),
            "<p>The three-point revolution was a straightforward expected-value argument. A 35% three is worth more than a 50% long two, and the mid-range game contracted accordingly. The second-order effects were less obvious: spacing became the primary roster constraint, centres who could not shoot or switch lost value, and defences reorganised around protecting the arc and the rim while conceding everything between.</p>",
            h2("Football: fourth down and the cost of caution"),
            "<p>Win-probability models have consistently shown that NFL coaches punt too often and kick field goals too readily in opponent territory. Adoption was slow because the incentives are asymmetric - a failed fourth-down attempt is visible and blamed, while a punt that quietly lowers win probability is not. That is now shifting, and aggregate fourth-down aggression has risen measurably across the league.</p>",
            h2("Where analytics still struggles"),
            "<ul>"
            "<li><strong>Injury prediction.</strong> Load-management models are noisy, and the outcome they predict is rare, which makes validation difficult.</li>"
            "<li><strong>Defence in basketball.</strong> Individual defensive impact remains poorly isolated from scheme and teammate quality.</li>"
            "<li><strong>Anything involving young players.</strong> Small samples and rapid development curves defeat most projection systems.</li>"
            "<li><strong>Chemistry and culture.</strong> Not unmeasurable in principle, but unmeasured in practice.</li>"
            "</ul>",
            h2("The real frontier: tracking data"),
            "<p>Optical and radar tracking now records every player's position many times per second. That turns sport into a spatial problem rather than an event-counting one, and it is where the next genuine edges are being found - in route spacing, in defensive positioning, in the value of movement that never appears in a box score.</p>",
        ),
    },
    {
        "category": "entertainment",
        "title": "Why the Streaming Business Stopped Chasing Subscribers and Started Chasing Profit",
        "focus_keyword": "streaming business model",
        "excerpt": "The growth-at-any-cost era is over. Password crackdowns, ad tiers and licensing reversals are all symptoms of the same shift in what investors now reward.",
        "meta_title": "The Streaming Business Model Shift: From Growth to Profit",
        "meta_description": "How streaming services moved from subscriber growth to profitability - ad-supported tiers, password sharing enforcement, licensing to rivals and what it means for viewers.",
        "tags": ["Streaming", "Media Business", "Analysis"],
        "content": p(
            "<p>For roughly a decade, streaming services were valued on subscriber additions. Content spending was a growth expense and losses were acceptable. That framework collapsed, and the consequences are visible in every product decision viewers now complain about.</p>",
            h2("What changed in the market"),
            "<p>When capital was cheap, discounted future subscribers justified enormous present losses. When rates rose, investors began asking a simpler question: does this business generate cash? Services that could not answer saw valuations reset hard, and management teams reoriented within a single fiscal year.</p>",
            h2("The four levers everyone pulled"),
            "<ol>"
            "<li><strong>Advertising tiers.</strong> Ad-supported plans lower the entry price while often producing higher revenue per user in mature markets than the ad-free tier they cannibalise.</li>"
            "<li><strong>Password-sharing enforcement.</strong> Converting borrowers into paying accounts turned out to be the cheapest subscriber acquisition available.</li>"
            "<li><strong>Licensing to competitors.</strong> The exclusivity doctrine reversed. Libraries that sat unwatched are now sold to rivals because margin beats moat.</li>"
            "<li><strong>Content discipline.</strong> Fewer, larger bets. Cancellation decisions now weigh completion rates and marginal retention rather than raw viewing hours.</li>"
            "</ol>",
            h2("What this means for what you watch"),
            "<p>Expect fewer mid-budget originals, more franchise extensions, more unscripted programming - which is dramatically cheaper per hour - and more live sport, which remains the only reliable driver of simultaneous mass viewership and therefore of advertising value.</p>",
            h2("The bundling loop closes"),
            "<p>The unbundling of cable produced a dozen services that together cost more than cable did. The industry's answer is rebundling: combined offerings, carrier partnerships and hard-bundled tiers. The economics of distribution have reasserted themselves, as they generally do.</p>",
        ),
    },
    {
        "category": "crypto",
        "title": "Reading a Crypto White Paper: A Practical Framework for Spotting Weak Projects",
        "focus_keyword": "crypto white paper",
        "excerpt": "Most tokens fail for reasons visible in their own documentation. A structured read of six sections separates engineering from marketing.",
        "meta_title": "How to Read a Crypto White Paper and Spot Red Flags",
        "meta_description": "A practical framework for evaluating cryptocurrency projects: tokenomics, distribution, consensus, governance, audits and team disclosure - and the red flags in each.",
        "tags": ["Cryptocurrency", "Due Diligence", "Blockchain"],
        "content": p(
            "<p>A white paper is a sales document that is legally obliged to be somewhat honest. Read in the right order, it usually reveals whether a project is an engineering effort or a distribution scheme.</p>",
            h2("1. Start with the token distribution, not the introduction"),
            "<p>Find the allocation table first. What percentage went to the team, to investors, to a foundation, and to the public? What are the vesting cliffs? A project where insiders hold a large majority with short lockups has a built-in seller at every price level, regardless of how good the technology is.</p>",
            h2("2. Ask what the token is actually for"),
            "<p>There are only a few defensible answers: it pays for network resources, it secures the network through staking, or it confers governance rights over something with real value. If the token exists mainly so there is something to sell, the paper will be vague here. Vagueness in this section is the single most reliable red flag.</p>",
            h2("3. Check the consensus and security assumptions"),
            "<p>Who can censor a transaction? How many entities would have to collude to rewrite history? For newer chains, what is the cost of attacking the network relative to the value it secures? A chain whose validator set is a handful of entities controlled by the founding company is a database with extra steps.</p>",
            h2("4. Read the governance section sceptically"),
            "<p>Look for who controls upgrades, whether there is an admin key, and whether that key can freeze funds or mint new tokens. Many projects described as decentralised retain a multisig that can do both. That is not automatically disqualifying - but it should be disclosed, and it changes the risk profile entirely.</p>",
            h2("5. Verify the audits rather than counting them"),
            "<p>An audit is a point-in-time review of specific contracts, not a guarantee. Open the actual report. Check which contracts were covered, what severity findings were raised, and whether they were resolved. An audit badge with no linked report is decoration.</p>",
            h2("6. Look for named people with checkable histories"),
            "<p>Anonymity has a legitimate history in this field. But anonymity combined with a large insider allocation and an admin key is a specific and well-documented risk pattern.</p>",
            h2("Red flags, condensed"),
            "<ul>"
            "<li>Guaranteed or 'passive' returns of any kind.</li>"
            "<li>Referral bonuses that pay for recruitment rather than usage.</li>"
            "<li>A roadmap made of partnerships rather than shipped software.</li>"
            "<li>A technical section that could describe any blockchain.</li>"
            "<li>Countdown timers and urgency in a document about infrastructure.</li>"
            "</ul>",
            "<p><em>This is journalism, not investment advice. Cryptocurrency is volatile and you can lose your entire investment.</em></p>",
        ),
    },
    {
        "category": "business",
        "title": "What Actually Moves the Fed: Reading the Data the Committee Reads",
        "focus_keyword": "federal reserve decisions",
        "excerpt": "Rate decisions are not made on the headline inflation number. Here are the specific series the FOMC weights, and how to read them before the meeting rather than after.",
        "meta_title": "What Data Drives Federal Reserve Interest Rate Decisions",
        "meta_description": "A guide to the economic indicators the FOMC actually watches - core PCE, the employment cost index, breakevens and financial conditions - and how to read them.",
        "tags": ["Federal Reserve", "Inflation", "Markets"],
        "content": p(
            "<p>The Federal Open Market Committee has a dual mandate: maximum employment and stable prices. Almost everything it does can be reconstructed from a short list of data series - none of which is the headline CPI number that leads the news.</p>",
            h2("Core PCE, not CPI"),
            "<p>The Fed's two percent target is defined on the personal consumption expenditures price index, not the consumer price index. PCE weights shift as consumers substitute between goods, and it treats healthcare costs differently. The two series routinely diverge by several tenths of a percentage point, which is a large gap when the target is two percent.</p>",
            h2("The employment cost index"),
            "<p>Wage growth matters to the committee because it is the most persistent component of services inflation. The quarterly employment cost index is preferred over average hourly earnings because it controls for composition - it does not get distorted when the mix of jobs being created changes.</p>",
            h2("Breakevens and survey expectations"),
            "<p>The five-year, five-year forward inflation expectation rate, derived from Treasury inflation-protected securities, tells the committee whether markets believe the target will be met over the long run. Consumer surveys from the University of Michigan and the New York Fed serve the same purpose for households. Anchored expectations give the Fed room to be patient; un-anchoring is the scenario it fears most.</p>",
            h2("Financial conditions"),
            "<p>The policy rate is an input, not the outcome. What matters for the real economy is the whole complex of credit spreads, equity valuations, the dollar and mortgage rates. This is why a rate cut accompanied by hawkish guidance can tighten conditions, and why the committee treats communication as a policy tool in its own right.</p>",
            h2("Reading the dot plot correctly"),
            "<p>The Summary of Economic Projections shows where each participant thinks rates should be. It is not a commitment, it is not a vote, and the median is not a forecast the committee has agreed. Its value is in the distribution: a tight cluster signals consensus, a wide spread signals genuine internal disagreement about the path.</p>",
            h2("The lag problem"),
            "<p>Monetary policy affects the real economy with what economists have long described as long and variable lags, commonly estimated at somewhere between four and eighteen months. This is the core difficulty of the job: the committee must set policy for conditions that will exist when today's decision finally bites, using data that describes conditions that already passed.</p>",
        ),
    },
    {
        "category": "lifestyle",
        "title": "A Realistic Guide to Cutting Your Grocery Bill Without Eating Worse",
        "focus_keyword": "cut grocery bill",
        "excerpt": "Most grocery advice trades money for time or nutrition. These changes do neither, and the savings compound across an entire year.",
        "meta_title": "How to Cut Your Grocery Bill Without Sacrificing Nutrition",
        "meta_description": "Practical, tested ways to reduce grocery spending - unit pricing, strategic frozen and tinned buying, waste reduction and the cuts that cost less per gram of protein.",
        "tags": ["Personal Finance", "Food", "Budgeting"],
        "content": p(
            "<p>Food is the most elastic line in most household budgets, which is why it absorbs pressure when other costs rise. The goal here is not austerity; it is removing spending that buys nothing.</p>",
            h2("Learn to read the unit price, then trust it"),
            "<p>The shelf tag almost always carries a price per ounce, per 100g or per item, in small print beneath the headline price. Larger packages are not reliably cheaper per unit, and promotional pricing frequently inverts the relationship. Comparing unit prices costs no time once it becomes habit and removes an entire category of error.</p>",
            h2("Buy protein by cost per gram, not cost per package"),
            "<p>Whole chicken, eggs, tinned fish, dried and tinned legumes, and tougher cuts that suit slow cooking deliver substantially more protein per dollar than pre-portioned fillets and prepared products. Nothing here is a nutritional downgrade - tinned sardines and lentils are among the better things you can eat.</p>",
            h2("Frozen produce is not a compromise"),
            "<p>Vegetables and fruit destined for freezing are typically processed within hours of harvest, which preserves nutrients that degrade during the days fresh produce spends in transit and on shelves. Frozen costs less, does not spoil, and eliminates the waste that quietly inflates the fresh-produce budget.</p>",
            h2("Attack waste before you attack prices"),
            "<p>Studies of household food waste in developed economies consistently find a meaningful share of purchased food is thrown away. That is a straight percentage off the grocery bill available without changing a single purchasing decision. Three things do most of the work:</p>",
            "<ul>"
            "<li>Shop from a list built from what is already in the fridge.</li>"
            "<li>Understand that 'best before' is a quality date, not a safety date - unlike 'use by'.</li>"
            "<li>Keep one meal a week that exists to consume leftovers.</li>"
            "</ul>",
            h2("Where store brands genuinely match"),
            "<p>Commodity staples - flour, sugar, rice, oats, tinned tomatoes, frozen vegetables, dairy, over-the-counter medication - are frequently produced in the same facilities as branded equivalents to the same specification. Differences are more defensible in products where formulation matters, such as coffee or sauces.</p>",
            h2("What is usually not worth it"),
            "<p>Bulk buying perishables you will not finish, warehouse memberships for a one- or two-person household, and time-intensive coupon strategies that save a few dollars an hour. Savings that cost more than they return are not savings.</p>",
        ),
    },
    {
        "category": "marketing",
        "title": "What Google's Helpful Content Signals Mean for Publishers in Practice",
        "focus_keyword": "helpful content update",
        "excerpt": "Sites that lost traffic rarely lost it for the reason they assume. The recoverable problems are structural, and they are identifiable without guessing.",
        "meta_title": "Google Helpful Content: What Publishers Should Actually Change",
        "meta_description": "A practical read on Google's helpful content signals: what site-wide classification means, why recovery is slow, and the structural fixes that actually move rankings.",
        "tags": ["SEO", "Google", "Content Strategy"],
        "content": p(
            "<p>Google's move to fold helpful-content signals into its core ranking systems changed the diagnostic problem for publishers. There is no single switch to flip, which is precisely why so much recovery advice is wrong.</p>",
            h2("The signal is evaluative, not punitive"),
            "<p>It helps to stop thinking of this as a penalty. There is no manual action, no notification in Search Console, and no reconsideration request. What changed is how the system assesses whether a page satisfies the person who searched. Thin pages can drag down the assessment of a whole site, which is why removing or improving weak content sometimes lifts pages that were never the problem.</p>",
            h2("Four structural problems that actually matter"),
            "<ol>"
            "<li><strong>Content written for a query rather than a reader.</strong> Pages assembled by summarising the current top ten results add nothing that is not already indexed.</li>"
            "<li><strong>Topical sprawl.</strong> A site with genuine authority in one area that starts publishing high-volume content in unrelated areas dilutes the signal that made it credible.</li>"
            "<li><strong>No demonstrable first-hand experience.</strong> Product reviews without original photography, measurement or testing are the clearest example, and the area where Google has been most explicit.</li>"
            "<li><strong>Missing accountability.</strong> No named authors, no verifiable credentials, no contact route, no correction policy. These are cheap to fix and frequently absent.</li>"
            "</ol>",
            h2("Why recovery takes so long"),
            "<p>The classification is evaluated over an extended window. Deleting a thousand thin pages today does not produce a signal tomorrow, because the system is assessing a pattern over time. Publishers who make a real change, then panic and reverse it after six weeks, never give the change a chance to register.</p>",
            h2("What to do, in order"),
            "<ul>"
            "<li>Inventory every indexed URL and classify each as valuable, improvable or deletable. Be honest in the third category.</li>"
            "<li>Improve or consolidate the middle group; remove the bottom group with proper redirects where a relevant target exists.</li>"
            "<li>Add real bylines, biographies with verifiable expertise, a visible editorial policy and a corrections route.</li>"
            "<li>Add something to every page that cannot be obtained by reading the competition: original data, photography, testing, or direct expertise.</li>"
            "<li>Then wait through at least one full core update before judging the result.</li>"
            "</ul>",
            '<p>Google&apos;s own guidance is published in its <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" target="_blank" rel="noopener noreferrer">creating helpful content documentation</a>, and it is worth reading in the original rather than in summary.</p>',
        ),
    },
]


def upload_cover(db, path: Path, author_id: int) -> str:
    data = path.read_bytes()
    info = save_image(data, path.name, MIME_BY_SUFFIX.get(path.suffix.lower(), "image/jpeg"))
    db.add(Media(**info, alt=path.stem.replace("-", " ").title(), uploaded_by=author_id))
    db.commit()
    return info["url"]


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed starter articles.")
    parser.add_argument("--covers", default="./covers", help="Directory of <category>-<n>.jpg cover images")
    parser.add_argument("--force", action="store_true", help="Seed even if published posts already exist")
    args = parser.parse_args()

    bootstrap_run()
    covers_dir = Path(args.covers)

    with SessionLocal() as db:
        existing = db.query(Post).filter(Post.status == PostStatus.published).count()
        if existing and not args.force:
            print(f"{existing} published articles already exist. Use --force to seed anyway.")
            return 0

        author = db.query(User).order_by(User.id).first()
        if not author:
            print("No user found - start the API once so the admin account is created.")
            return 1

        created = 0
        for offset, spec in enumerate(ARTICLES):
            category = db.query(Category).filter(Category.slug == spec["category"]).one_or_none()
            if not category:
                print(f"  ! category {spec['category']} missing, skipping")
                continue
            if db.query(Post).filter(Post.title == spec["title"]).first():
                print(f"  = already seeded: {spec['title'][:52]}...")
                continue

            images = sorted(covers_dir.glob(f"{spec['category']}-*.jpg"))
            urls = [upload_cover(db, path, author.id) for path in images]

            post = Post(
                title=spec["title"],
                excerpt=spec["excerpt"],
                cover_image=urls[0] if urls else "",
                cover_alt=f"{category.name}: {spec['title']}",
                cover_caption=f"Illustration: {category.name} desk / Daily US Wire",
                category_id=category.id,
                author_id=author.id,
                status=PostStatus.published,
                published_at=datetime.now(timezone.utc) - timedelta(hours=offset * 5 + 1),
                meta_title=spec["meta_title"],
                meta_description=spec["meta_description"],
                focus_keyword=spec["focus_keyword"],
                is_featured=offset == 0,
                is_breaking=offset < 2,
                is_editors_pick=offset % 3 == 0,
            )
            apply_content(post, spec["content"])
            ensure_slug(db, post, spec["title"])
            apply_seo_defaults(post)
            post.tags = resolve_tags(db, spec["tags"])
            db.add(post)
            db.flush()

            for i, url in enumerate(urls[1:5], start=0):
                post.images.append(
                    PostImage(
                        url=url,
                        alt=f"{category.name} illustration {i + 1} for {spec['title']}",
                        caption=f"{category.name} desk illustration",
                        credit="Daily US Wire",
                        position=i,
                    )
                )
            db.commit()
            created += 1
            print(f"  + {category.name}: {spec['title'][:60]}")

        print(f"\nSeeded {created} article(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
