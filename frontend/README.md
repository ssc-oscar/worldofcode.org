# World of Code Frontend

Next generation frontend of worldofcode.org.

## Stack

- Framework - [React 19](https://react.dev/)
- Language - [TypeScript](https://www.typescriptlang.org)
- Styling - [Unocss](https://unocss.dev)
- Components - [Shadcn-ui](https://ui.shadcn.com)
- Charts and Graphs - [Ant Design Charts](https://charts.ant.design)
- Linting - [ESLint](https://eslint.org)
- Formatting - [Prettier](https://prettier.io)

## Build for production

Follow these steps to clone the repository and start the development server:

```bash
git clone https://github.com/ssc-oscar/woc-frontend.git
cd woc-frontend
npm install -g pnpm  # if you haven't installed pnpm yet
pnpm install
pnpm run dev
```

You should now be able to access the application at http://localhost:4000.

If you want to connect the live backend, add a `.env.local` file in the root directory with the following:

```ini
VITE_BASE_URL="https://replace.with.your.backend.url"
VITE_TURNSTILE_SITE_ID="0xREPLACE_WITH_YOUR_SITE_ID"
```
