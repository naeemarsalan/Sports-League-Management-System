--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2 (Debian 16.2-1.pgdg120+2)
-- Dumped by pg_dump version 16.2 (Debian 16.2-1.pgdg120+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: matches; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    player1_id integer NOT NULL,
    player2_id integer NOT NULL,
    week_commencing date NOT NULL,
    scheduled_at timestamp without time zone,
    score_player1 integer,
    score_player2 integer,
    is_completed boolean DEFAULT false
);


ALTER TABLE public.matches OWNER TO admin;

--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matches_id_seq OWNER TO admin;

--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- Name: players; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.players (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.players OWNER TO admin;

--
-- Name: players_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.players_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.players_id_seq OWNER TO admin;

--
-- Name: players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.players_id_seq OWNED BY public.players.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role text NOT NULL,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'player'::text])))
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO admin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: players id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.players ALTER COLUMN id SET DEFAULT nextval('public.players_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.matches (id, player1_id, player2_id, week_commencing, scheduled_at, score_player1, score_player2, is_completed) FROM stdin;
1	1	2	2025-06-16	\N	6	8	t
3	5	6	2025-06-16	\N	8	3	t
2	3	4	2025-06-16	\N	8	3	t
12	3	5	2025-06-30	\N	8	3	t
6	2	6	2025-06-23	\N	4	8	t
5	1	4	2025-06-23	\N	8	6	t
8	5	7	2025-06-23	\N	8	4	t
9	1	6	2025-06-30	\N	8	5	t
16	2	3	2025-07-07	\N	8	5	t
15	4	5	2025-07-07	\N	2	8	t
4	7	8	2025-06-16	\N	8	3	t
10	4	8	2025-06-30	\N	7	7	t
20	4	2	2025-07-14	2025-07-15 19:15:00	8	0	t
13	1	8	2025-07-07	2025-07-18 19:00:00	8	2	t
18	8	5	2025-07-14	2025-07-18 19:00:00	8	2	t
26	5	2	2025-07-28	\N	8	6	t
7	3	8	2025-06-23	\N	8	2	t
22	7	3	2025-07-21	\N	2	8	t
24	6	4	2025-07-21	\N	5	8	t
14	6	7	2025-07-07	\N	5	8	t
21	1	5	2025-07-21	\N	3	8	t
19	6	3	2025-07-14	\N	1	8	t
25	1	3	2025-07-28	\N	7	7	t
27	7	4	2025-07-28	\N	7	7	t
28	8	6	2025-07-28	\N	6	8	t
30	4	3	2025-08-04	\N	8	5	t
23	8	2	2025-07-21	\N	8	3	t
31	6	5	2025-08-04	\N	6	8	t
32	8	7	2025-08-04	\N	6	8	t
17	1	7	2025-07-14	\N	8	4	t
35	8	3	2025-08-11	\N	5	8	t
33	4	1	2025-08-11	2025-08-12 18:00:00	5	8	t
40	5	3	2025-08-18	\N	8	6	t
34	6	2	2025-08-11	\N	6	8	t
37	6	1	2025-08-18	\N	6	8	t
36	7	5	2025-08-11	\N	4	8	t
11	2	7	2025-06-30	\N	4	8	t
43	5	4	2025-08-25	\N	7	7	t
42	7	6	2025-08-25	\N	4	8	t
47	3	6	2025-09-01	\N	8	3	t
45	7	1	2025-09-01	\N	7	7	t
44	3	2	2025-08-25	\N	8	6	t
50	3	7	2025-09-08	\N	8	4	t
55	4	7	2025-09-15	\N	6	8	t
49	5	1	2025-09-08	\N	8	2	t
41	8	1	2025-08-25	\N	2	8	t
46	5	8	2025-09-01	\N	7	7	t
48	2	4	2025-09-01	2025-09-14 16:43:00	1	8	t
39	7	2	2025-08-18	\N	8	4	t
29	2	1	2025-08-04	\N	8	4	t
54	2	5	2025-09-15	\N	1	8	t
38	8	4	2025-08-18	\N	4	8	t
53	3	1	2025-09-15	\N	8	6	t
52	4	6	2025-09-08	\N	8	4	t
51	2	8	2025-09-08	\N	4	8	t
56	6	8	2025-09-15	\N	4	8	t
\.


--
-- Data for Name: players; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.players (id, user_id, name) FROM stdin;
1	2	Adam Byron
2	3	Nathan Fraser
3	4	Reece Fraser
4	5	Danny Tatton
5	6	Simon Knowles
6	7	Gareth Caldwell
7	8	Mike Henderson
8	9	Rob Oliver
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (id, username, password, role) FROM stdin;
1	admin	$2b$12$6uXzOifQP0gVdO9cvdUYEu4av5EyKg1QtO180xOcGesWkdjzMkyl6	admin
2	Adam	$2b$12$4JyObeXyurgAlpVMI6Iene./dU0blaZuJs4dXknoA/C2i7YTQdX92	player
10	Shannon	$2b$12$7Kopohuk3rSP6XOdb6aEy.FWr0kqHUgMnKDPE3i1VN4oOylISC1K6	player
6	simon	$2b$12$vYr4uI24tNsnP3VkrPLVMezC2Y6UQvidVKp4VNEshOlbgYUixU6pW	player
3	nathan	$2b$12$BqOmbDqAXHRHAhNqU2/tvul5sfOOnxeTwejQiN7LFOTqxBNcj.PXO	player
5	danny	$2b$12$LMaVYcW8znwWS3v7sxtvXuT/x8FE6b34vZKvspLRL410GahV6Z.rK	player
4	reece	$2b$12$JRUeqrMP3V22KZ1ylOxl.e0NW1nc2ABExLDR/UYiO/tdjuY6t0QfW	player
7	gaz	$2b$12$zeI0T.POYKxhk7cvffG7eu6lmcpvf.r6w8Tuu7KzJdK8bGWdfmTdu	player
8	mike	$2b$12$RMt9I.0rP5jFTGHU.70Xm.9ree1/Ysiv6ZrShvPadpSszI71WfVaa	player
9	rob	$2b$12$Nc0CiavuSBDiEFlggOtaRuF9CBFHwbv5WX6YsE/v24zU57q1LIHxy	player
11	gareth	$2b$12$mzrAhqGhyk6ef3Ozo9mIW.Otm/Fdr/EjSxHLpKnfP7XuNl9D0RSZm	player
12	shannon-test	$2b$12$ePKnoaCcHNcYncmtBkvzHensqhXMgMy/.fwAsewsa6FtPAIZdKYGG	player
13	Joseph	$2b$12$ZpViNa07MTFMZdsPJOMKSeUX0UxLIdEbWCGPVa/1MAQD1tRsMXJNy	player
14	Adam@isgay.com	$2b$12$S8bm6Zij11c3frDBJsYl1e2uCfCUttvT7GSHEvyi/gpCjYmhCfyeu	player
15	shannon3	$2b$12$VVkFH98OKmYzqQuUCPOd2unpqa5ljvNxT7PT.mVfsxmJjWQX5dDcy	player
16	shannon4	$2b$12$HlkDGHiP88Bi0Dl.jKry9OyUdfz6ZVryR/wfopnUDZg0iAlGyEqEq	player
\.


--
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.matches_id_seq', 56, true);


--
-- Name: players_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.players_id_seq', 8, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.users_id_seq', 16, true);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- Name: players players_user_id_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_user_id_key UNIQUE (user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: matches matches_player1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES public.players(id);


--
-- Name: matches matches_player2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES public.players(id);


--
-- Name: players players_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

