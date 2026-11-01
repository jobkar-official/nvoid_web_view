"use client";

import { Asterisk, ArrowUpRight, Globe2, Search } from "lucide-react";

export default function WorkerHomepage() {
  return (
    <div className="nvoid-homepage">
      <div className="nvoid-home-mark" aria-hidden="true"><Asterisk size={28} strokeWidth={1.7} /></div>
      <span className="nvoid-home-eyebrow">YOUR GLOBAL CAREER AGENT</span>
      <h1>What opportunity are you looking for?</h1>
      <p className="nvoid-home-description">Tell Nvoid what you want to do next. Discover relevant opportunities across global job sources and company career pages in one place.</p>

      <form className="nvoid-search-composer" action="/job-search" method="get">
        <label className="nvoid-composer-field" htmlFor="home-role">
          <span>Role, skills or keywords</span>
          <input id="home-role" name="role" placeholder="e.g. Senior Product Designer, Java Developer" autoComplete="off" required />
        </label>
        <label className="nvoid-composer-field" htmlFor="home-location">
          <span><Globe2 size={13} /> Location</span>
          <input id="home-location" name="location" defaultValue="Worldwide" placeholder="Country, city or remote" autoComplete="off" required />
        </label>
        <div className="nvoid-composer-footer">
          <span>Review every result before taking action.</span>
          <button type="submit"><Search size={16} /> Find opportunities <ArrowUpRight size={15} /></button>
        </div>
      </form>
      <div className="nvoid-home-footnote">Global discovery · Source-linked results · You stay in control</div>
    </div>
  );
}
