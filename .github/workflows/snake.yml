name: Generate Snake

on:
  push:
    branches:
      - main
      - master
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Generate Snake Game
        uses: Platane/snk/svg-only@v3
        with:
          github_user_name: VMedeiros
          outputs: |
            dist/github-snake.svg?color_snake=#39d353&color_dots=#ebedf0,#9be9a8,#40c463,#30a14e,#216e39
            dist/github-snake-dark.svg?palette=github-dark&color_snake=#39d353&color_dots=#161b22,#0e4429,#006d32,#26a641,#39d353

      - name: Generate contribution progress bar
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Fetch contribution data from GitHub API
          YEAR=$(date +%Y)
          QUERY='query { user(login: "VMedeiros") { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } } } } }'
          RESPONSE=$(gh api graphql -f query="$QUERY")

          TOTAL=$(echo "$RESPONSE" | jq '.data.user.contributionsCollection.contributionCalendar.totalContributions')
          DAYS_WITH=$(echo "$RESPONSE" | jq '[.data.user.contributionsCollection.contributionCalendar.weeks[].contributionDays[] | select(.contributionCount > 0)] | length')
          TOTAL_DAYS=$(echo "$RESPONSE" | jq '[.data.user.contributionsCollection.contributionCalendar.weeks[].contributionDays[]] | length')

          PCT=$((DAYS_WITH * 100 / TOTAL_DAYS))
          BAR_WIDTH=$((PCT * 480 / 100))

          # Dark version
          cat > dist/contribution-progress-dark.svg << SVGEOF
          <svg xmlns="http://www.w3.org/2000/svg" width="540" height="40" viewBox="0 0 540 40">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#0e4429"/>
                <stop offset="40%" style="stop-color:#006d32"/>
                <stop offset="70%" style="stop-color:#26a641"/>
                <stop offset="100%" style="stop-color:#39d353"/>
              </linearGradient>
              <clipPath id="bar-clip">
                <rect x="10" y="8" width="${BAR_WIDTH}" height="24" rx="12"/>
              </clipPath>
            </defs>
            <rect x="10" y="8" width="480" height="24" rx="12" fill="#161b22"/>
            <rect x="10" y="8" width="480" height="24" rx="12" fill="url(#grad)" clip-path="url(#bar-clip)"/>
            <text x="500" y="26" font-family="'Segoe UI',system-ui,sans-serif" font-weight="bold" font-size="14" fill="#39d353">${PCT}%</text>
            <text x="$((10 + BAR_WIDTH / 2))" y="25" font-family="'Segoe UI',system-ui,sans-serif" font-size="11" fill="#ffffff" text-anchor="middle" opacity="0.9">${DAYS_WITH}/${TOTAL_DAYS} days · ${TOTAL} contributions</text>
          </svg>
          SVGEOF

          # Light version
          cat > dist/contribution-progress.svg << SVGEOF
          <svg xmlns="http://www.w3.org/2000/svg" width="540" height="40" viewBox="0 0 540 40">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#9be9a8"/>
                <stop offset="40%" style="stop-color:#40c463"/>
                <stop offset="70%" style="stop-color:#30a14e"/>
                <stop offset="100%" style="stop-color:#216e39"/>
              </linearGradient>
              <clipPath id="bar-clip">
                <rect x="10" y="8" width="${BAR_WIDTH}" height="24" rx="12"/>
              </clipPath>
            </defs>
            <rect x="10" y="8" width="480" height="24" rx="12" fill="#ebedf0"/>
            <rect x="10" y="8" width="480" height="24" rx="12" fill="url(#grad)" clip-path="url(#bar-clip)"/>
            <text x="500" y="26" font-family="'Segoe UI',system-ui,sans-serif" font-weight="bold" font-size="14" fill="#216e39">${PCT}%</text>
            <text x="$((10 + BAR_WIDTH / 2))" y="25" font-family="'Segoe UI',system-ui,sans-serif" font-size="11" fill="#ffffff" text-anchor="middle" opacity="0.9">${DAYS_WITH}/${TOTAL_DAYS} days · ${TOTAL} contributions</text>
          </svg>
          SVGEOF

      - name: Push to output branch
        uses: crazy-max/ghaction-github-pages@v4
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
