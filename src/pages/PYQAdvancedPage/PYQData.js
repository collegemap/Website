/**
 * Previous Year Question Papers Data
 *
 * Structure of each entry:
 * {
 *   id        : number         – unique identifier
 *   exam      : string         – "JEE Main" | "JEE Advanced"
 *   year      : number         – e.g. 2024
 *   session   : string         – "Session 1" | "Session 2"
 *   date      : string         – human-readable date, e.g. "January 27, 2024"
 *   shift     : string         – "Shift 1" | "Shift 2"
 *   paperUrl  : string | null  – Google Drive link to the question paper PDF
 *   answerUrl : string | null  – Google Drive link to the answer key PDF
 * }
 *
 * HOW TO ADD A NEW PAPER:
 * 1. Copy one of the objects below.
 * 2. Increment `id` by 1.
 * 3. Fill in the correct year, session, date, shift.
 * 4. Paste the Google Drive share link into `paperUrl` and `answerUrl`.
 *    (Use the "Share → Anyone with the link" URL from Google Drive.)
 * 5. Set `paperUrl` or `answerUrl` to null if the PDF is not yet available.
 */

export const pyqData = [
  {
    id: 1,
    exam: "JEE Main",
    year: 2025,
    session: "Session 1",
    date: "January 23, 2025",
    shift: "Shift 2",
    paperUrl: "https://drive.google.com/file/d/1XSCNChU8bJXNiabY-s4BM-eWX5ZSc5ft/view?usp=drive_link",
},
{
    id: 2,
    exam: "JEE Main",
    year: 2025,
    session: "Session 1",
    date: "January 24, 2025",
    shift: "Shift 1",
    paperUrl: "https://drive.google.com/file/d/1uh3W7hLqnkN101febDyE5-PfXrBSWEU3/view?usp=drive_link",
},
{
    id: 3,
    exam: "JEE Main",
    year: 2025,
    session: "Session 2",
    date: "April 2, 2025",
    shift: "Shift 1",
    paperUrl: "https://drive.google.com/file/d/1Imc_XUbPN7dOzXfZBdPhBKq2EUtjVsBm/view?usp=drive_link",
},
{
    id: 4,
    exam: "JEE Main",
    year: 2025,
    session: "Session 2",
    date: "April 2, 2025",
    shift: "Shift 2",
    paperUrl: "https://drive.google.com/file/d/1F7IrTJSh0vvAQANdnCQWHxyOCuLvg8ah/view?usp=drive_link",
},
{
    id: 5,
    exam: "JEE Main",
    year: 2025,
    session: "Session 2",
    date: "April 3, 2025",
    shift: "Shift 1",
    paperUrl: "https://drive.google.com/file/d/1uzME0Zahbhtbp9W7NMlHWS7Z-r-LlSGI/view?usp=drive_link",
},
{
    id: 6,
    exam: "JEE Main",
    year: 2025,
    session: "Session 2",
    date: "April 3, 2025",
    shift: "Shift 2",
    paperUrl: "https://drive.google.com/file/d/1GSGdydWhTUKI44tbqIOfp75AhKOey-fr/view?usp=drive_link",
},
{
    id: 7,
    exam: "JEE Main",
    year: 2025,
    session: "Session 2",
    date: "April 4, 2025",
    shift: "Shift 1",
    paperUrl: "https://drive.google.com/file/d/1RY19u_HIsVi-4CDSD5iuMcu2DI5kSnfC/view?usp=drive_link",
},
{
    id: 8,
    exam: "JEE Main",
    year: 2025,
    session: "Session 2",
    date: "April 4, 2025",
    shift: "Shift 2",
    paperUrl: "https://drive.google.com/file/d/1Z-4Q18UQX_yZi0WbOtoI_vmhzZIlbZIZ/view?usp=drive_link",
},
{
    id: 9,
    exam: "JEE Main",
    year: 2025,
    session: "Session 2",
    date: "April 7, 2025",
    shift: "Shift 1",
    paperUrl: "https://drive.google.com/file/d/1P1tWfLpcnHLGp4rcgtMe1s8d9xVbmTVa/view?usp=drive_link",
},
{
    id: 10,
    exam: "JEE Main",
    year: 2025,
    session: "Session 2",
    date: "April 7, 2025",
    shift: "Shift 2",
    paperUrl: "https://drive.google.com/file/d/1JSKNDvn394Og05WiucNrdg5PtI6xj10F/view?usp=drive_link",
},
{
    id: 11,
    exam: "JEE Main",
    year: 2025,
    session: "Session 2",
    date: "April 8, 2025",
    shift: "Shift 2",
    paperUrl: "https://drive.google.com/file/d/1uQxchO_tB6cTLMgPC18eEmBw3HZ4-EG_/view?usp=drive_link",
},
{
    id: 12,
    exam: "JEE Main",
    year: 2026,
    session: "Session 1",
    date: "January 21, 2026",
    shift: "Shift 1",
    paperUrl: "https://drive.google.com/file/d/1Xmaig3R2hyDjTcDBr3C14ZkrRVV2al3h/view?usp=drive_link",
},
{
    id: 13,
    exam: "JEE Main",
    year: 2026,
    session: "Session 1",
    date: "January 21, 2026",
    shift: "Shift 2",
    paperUrl: "https://drive.google.com/file/d/1L4-pyNo294092b7ubIC1CbRHuEg-wvE5/view?usp=drive_link",
},
{
    id: 14,
    exam: "JEE Main",
    year: 2026,
    session: "Session 1",
    date: "January 22, 2026",
    shift: "Shift 1",
    paperUrl: "https://drive.google.com/file/d/1F_GtSWOfnKnuNa_wta1wMTESGM0EB0Lk/view?usp=drive_link",
},
{
    id: 15,
    exam: "JEE Main",
    year: 2026,
    session: "Session 1",
    date: "January 22, 2026",
    shift: "Shift 2",
    paperUrl: "https://drive.google.com/file/d/1Gc8Ej1vJFxtWtQ2lyTa_SiKBfWPe7HiT/view?usp=drive_link",
},
{
    id: 16,
    exam: "JEE Main",
    year: 2026,
    session: "Session 1",
    date: "January 23, 2026",
    shift: "Shift 1",
    paperUrl: "https://drive.google.com/file/d/1DQJr7M92dwCLMsolPgFwgYZDTnQAYnFB/view?usp=drive_link",
},
{
    id: 17,
    exam: "JEE Main",
    year: 2026,
    session: "Session 1",
    date: "January 23, 2026",
    shift: "Shift 2",
    paperUrl: "https://drive.google.com/file/d/1Bq7A8apN6fgi_HhMre4qT-bCdGoAVG4_/view?usp=drive_link",
},
{
    id: 18,
    exam: "JEE Main",
    year: 2026,
    session: "Session 1",
    date: "January 24, 2026",
    shift: "Shift 1",
    paperUrl: "https://drive.google.com/file/d/143OTeKO3TyVDzPUgDu283vMZsuKS4qk8/view?usp=drive_link",
},
{
    id: 19,
    exam: "JEE Main",
    year: 2026,
    session: "Session 1",
    date: "January 24, 2026",
    shift: "Shift 2",
    paperUrl: "https://drive.google.com/file/d/1IzXaooVl66GBC0u_l3XwQntlryG5QPqW/view?usp=drive_link",
},
{
    id: 20,
    exam: "JEE Main",
    year: 2026,
    session: "Session 1",
    date: "January 28, 2026",
    shift: "Shift 1",
    paperUrl: "https://drive.google.com/file/d/1XL530uEIyKq3iA152WXp8zPdVo8HzNpQ/view?usp=drive_link",
},
{
    id: 21,
    exam: "JEE Main",
    year: 2026,
    session: "Session 1",
    date: "January 28, 2026",
    shift: "Shift 2",
    paperUrl: "https://drive.google.com/file/d/1whiUoN3dUb2HguDokidTjnWew4hVwLRv/view?usp=drive_link",
},
];
