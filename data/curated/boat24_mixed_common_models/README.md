# Boat24 mixed common models draft dataset

This folder contains the Step 5.5 Boat24 draft dataset for owner/manual review.

This is not production scraping. These files are draft fixtures only and must not be imported automatically.

Status: Live collection did not produce rows. Boat24 access or parsing was blocked.

Source: Boat24

Initial target size: 10-20 rows. Hard cap: 20 rows.

Review rules before any future raw import:
- builder must be visible or intentionally corrected by the owner
- model must be visible or intentionally corrected by the owner
- year may be blank only if the owner accepts it
- price and currency must be visible for valuation-ready testing
- listing URL must be stable
- obvious parsing errors must be corrected
- `review_status` must remain `draft` until owner approval

Future ingestion boundary:
- approved rows may later be imported into `raw_listings` only
- no row from this folder may be inserted directly into `boats`, `listings`, or `valuation_ready_comparables`
- Step 4 pipeline remains the only path from raw records to normalized rows

Last run summary:
- queries attempted: 16
- listings attempted: 0
- rows extracted: 0
- rows needing manual review: 0

Collection blockers / warnings:
- Lagoon 42: https://www.boat24.com/en/search/?q=Lagoon+42 returned HTTP 403
- Lagoon 42: https://www.boat24.com/en/boats/search/?q=Lagoon+42 returned HTTP 403
- Lagoon 450: https://www.boat24.com/en/search/?q=Lagoon+450 returned HTTP 403
- Lagoon 450: https://www.boat24.com/en/boats/search/?q=Lagoon+450 returned HTTP 403
- Bali 4.1: https://www.boat24.com/en/search/?q=Bali+4.1 returned HTTP 403
- Bali 4.1: https://www.boat24.com/en/boats/search/?q=Bali+4.1 returned HTTP 403
- Bali 4.2: https://www.boat24.com/en/search/?q=Bali+4.2 returned HTTP 403
- Bali 4.2: https://www.boat24.com/en/boats/search/?q=Bali+4.2 returned HTTP 403
- Fountaine Pajot Lucia 40: https://www.boat24.com/en/search/?q=Fountaine+Pajot+Lucia+40 returned HTTP 403
- Fountaine Pajot Lucia 40: https://www.boat24.com/en/boats/search/?q=Fountaine+Pajot+Lucia+40 returned HTTP 403
- Fountaine Pajot Astrea 42: https://www.boat24.com/en/search/?q=Fountaine+Pajot+Astrea+42 returned HTTP 403
- Fountaine Pajot Astrea 42: https://www.boat24.com/en/boats/search/?q=Fountaine+Pajot+Astrea+42 returned HTTP 403
- Beneteau Oceanis 45: https://www.boat24.com/en/search/?q=Beneteau+Oceanis+45 returned HTTP 403
- Beneteau Oceanis 45: https://www.boat24.com/en/boats/search/?q=Beneteau+Oceanis+45 returned HTTP 403
- Beneteau Oceanis 46.1: https://www.boat24.com/en/search/?q=Beneteau+Oceanis+46.1 returned HTTP 403
- Beneteau Oceanis 46.1: https://www.boat24.com/en/boats/search/?q=Beneteau+Oceanis+46.1 returned HTTP 403
- Jeanneau Sun Odyssey 440: https://www.boat24.com/en/search/?q=Jeanneau+Sun+Odyssey+440 returned HTTP 403
- Jeanneau Sun Odyssey 440: https://www.boat24.com/en/boats/search/?q=Jeanneau+Sun+Odyssey+440 returned HTTP 403
- Jeanneau Sun Odyssey 449: https://www.boat24.com/en/search/?q=Jeanneau+Sun+Odyssey+449 returned HTTP 403
- Jeanneau Sun Odyssey 449: https://www.boat24.com/en/boats/search/?q=Jeanneau+Sun+Odyssey+449 returned HTTP 403
- Bavaria Cruiser 45: https://www.boat24.com/en/search/?q=Bavaria+Cruiser+45 returned HTTP 403
- Bavaria Cruiser 45: https://www.boat24.com/en/boats/search/?q=Bavaria+Cruiser+45 returned HTTP 403
- Bavaria Cruiser 46: https://www.boat24.com/en/search/?q=Bavaria+Cruiser+46 returned HTTP 403
- Bavaria Cruiser 46: https://www.boat24.com/en/boats/search/?q=Bavaria+Cruiser+46 returned HTTP 403
- Hanse 455: https://www.boat24.com/en/search/?q=Hanse+455 returned HTTP 403

Manual fallback if Boat24 blocks automated access:
- owner manually opens Boat24 search results for the seed models
- owner fills the CSV/JSON draft rows with visible facts only
- owner keeps `review_status=draft` until review is complete
- future import still targets raw ingestion only
