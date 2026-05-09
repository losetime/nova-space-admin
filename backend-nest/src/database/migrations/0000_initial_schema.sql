--
-- PostgreSQL database dump
--


-- Dumped from database version 16.2
-- Dumped by pg_dump version 18.3

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: dblink; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS dblink WITH SCHEMA public;


--
-- Name: EXTENSION dblink; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION dblink IS 'connect to other PostgreSQL databases from within a database';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: article_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.article_category AS ENUM (
    'basic',
    'advanced',
    'mission',
    'people'
);


--
-- Name: article_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.article_type AS ENUM (
    'article',
    'video'
);


--
-- Name: favorite_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.favorite_type AS ENUM (
    'satellite',
    'news',
    'education',
    'intelligence'
);


--
-- Name: feedback_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.feedback_status AS ENUM (
    'pending',
    'processing',
    'resolved',
    'closed'
);


--
-- Name: feedback_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.feedback_type AS ENUM (
    'bug',
    'feature',
    'suggestion',
    'other'
);


--
-- Name: intelligence_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.intelligence_category AS ENUM (
    'launch',
    'satellite',
    'industry',
    'research',
    'environment'
);


--
-- Name: milestone_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.milestone_category AS ENUM (
    'launch',
    'recovery',
    'orbit',
    'mission',
    'other'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'intelligence',
    'system',
    'achievement',
    'membership'
);


--
-- Name: points_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.points_action AS ENUM (
    'register',
    'daily_login',
    'share',
    'invite',
    'task_complete',
    'purchase',
    'consume',
    'admin_grant',
    'expire'
);


--
-- Name: push_record_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.push_record_status AS ENUM (
    'sent',
    'failed'
);


--
-- Name: push_subscription_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.push_subscription_status AS ENUM (
    'active',
    'paused',
    'cancelled'
);


--
-- Name: push_trigger_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.push_trigger_type AS ENUM (
    'scheduled',
    'manual'
);


--
-- Name: quiz_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quiz_category AS ENUM (
    'basic',
    'advanced',
    'mission',
    'people'
);


--
-- Name: subscription_plan; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_plan AS ENUM (
    'monthly',
    'quarterly',
    'yearly',
    'lifetime',
    'custom'
);


--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'expired',
    'cancelled',
    'pending'
);


--
-- Name: subscription_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_type AS ENUM (
    'space_weather',
    'intelligence'
);


--
-- Name: user_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_level AS ENUM (
    'basic',
    'advanced',
    'professional'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin',
    'super_admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: article_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_likes (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    article_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: article_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.article_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: article_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.article_likes_id_seq OWNED BY public.article_likes.id;


--
-- Name: benefits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.benefits (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(255),
    value_type character varying(20) DEFAULT 'number'::character varying,
    unit character varying(50),
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    code character varying(50),
    category character varying(50) DEFAULT 'general'::character varying
);


--
-- Name: company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    country character varying(50),
    founded_year integer,
    website character varying(255),
    description text,
    logo_url character varying(500),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: company_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_id_seq OWNED BY public.company.id;


--
-- Name: education_article_collects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.education_article_collects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    article_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: education_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.education_articles (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    summary text,
    cover character varying(500),
    category public.article_category DEFAULT 'basic'::public.article_category NOT NULL,
    type public.article_type DEFAULT 'article'::public.article_type NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    likes integer DEFAULT 0 NOT NULL,
    duration integer,
    tags text,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: education_articles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.education_articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: education_articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.education_articles_id_seq OWNED BY public.education_articles.id;


--
-- Name: education_quiz_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.education_quiz_answers (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    quiz_id integer NOT NULL,
    selected_index integer NOT NULL,
    is_correct boolean NOT NULL,
    points_earned integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: education_quiz_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.education_quiz_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: education_quiz_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.education_quiz_answers_id_seq OWNED BY public.education_quiz_answers.id;


--
-- Name: education_quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.education_quizzes (
    id integer NOT NULL,
    question text NOT NULL,
    options json NOT NULL,
    correct_index integer NOT NULL,
    explanation text,
    category public.quiz_category DEFAULT 'basic'::public.quiz_category NOT NULL,
    points integer DEFAULT 10 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: education_quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.education_quizzes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: education_quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.education_quizzes_id_seq OWNED BY public.education_quizzes.id;


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type public.feedback_type DEFAULT 'other'::public.feedback_type NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    status public.feedback_status DEFAULT 'pending'::public.feedback_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: intelligence_collects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intelligence_collects (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    intelligence_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: intelligence_collects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.intelligence_collects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: intelligence_collects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.intelligence_collects_id_seq OWNED BY public.intelligence_collects.id;


--
-- Name: intelligences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intelligences (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    summary text NOT NULL,
    content text NOT NULL,
    cover character varying(500),
    category public.intelligence_category DEFAULT 'launch'::public.intelligence_category NOT NULL,
    level character varying(50) NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    likes integer DEFAULT 0 NOT NULL,
    collects integer DEFAULT 0 NOT NULL,
    source character varying(100) NOT NULL,
    source_url character varying(500),
    tags text,
    analysis text,
    trend text,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: intelligences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.intelligences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: intelligences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.intelligences_id_seq OWNED BY public.intelligences.id;


--
-- Name: level_benefits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.level_benefits (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    level_id character varying(36) NOT NULL,
    benefit_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    display_text character varying(255)
);


--
-- Name: member_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_levels (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(255),
    icon character varying(10),
    is_default boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: membership_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membership_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    plan_code character varying(50) NOT NULL,
    duration_months integer NOT NULL,
    level character varying(20) NOT NULL,
    price numeric(10,2) NOT NULL,
    points_price integer,
    description text,
    features jsonb,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.milestones (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    content text,
    event_date date NOT NULL,
    category public.milestone_category DEFAULT 'other'::public.milestone_category NOT NULL,
    cover character varying(500),
    media jsonb,
    related_satellite_norad_id character varying(20),
    importance integer DEFAULT 1 NOT NULL,
    location character varying(100),
    organizer character varying(100),
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: milestones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.milestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: milestones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.milestones_id_seq OWNED BY public.milestones.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type public.notification_type DEFAULT 'system'::public.notification_type NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    related_id uuid,
    related_type character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: points_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.points_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action public.points_action NOT NULL,
    points integer NOT NULL,
    balance numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    description character varying(255),
    related_id character varying(100),
    related_type character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: push_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    trigger_type public.push_trigger_type DEFAULT 'manual'::public.push_trigger_type NOT NULL,
    subject character varying(255) NOT NULL,
    content text NOT NULL,
    sent_at timestamp without time zone NOT NULL,
    status public.push_record_status NOT NULL,
    error_message character varying(500),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    subscription_types text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    status public.push_subscription_status DEFAULT 'active'::public.push_subscription_status NOT NULL,
    last_push_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: satellite_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.satellite_metadata (
    norad_id character varying(50) NOT NULL,
    name character varying(200),
    object_id character varying(100),
    alt_name character varying(200),
    object_type character varying(100),
    status character varying(10),
    country_code character varying(100),
    launch_date date,
    stable_date date,
    launch_site character varying(100),
    launch_pad character varying(100),
    launch_vehicle character varying(100),
    flight_no character varying(100),
    cospar_launch_no character varying(100),
    launch_failure boolean,
    launch_site_name character varying(100),
    decay_date date,
    period double precision,
    inclination double precision,
    apogee double precision,
    perigee double precision,
    eccentricity double precision,
    raan double precision,
    arg_of_perigee double precision,
    rcs character varying(100),
    std_mag double precision,
    tle_epoch timestamp without time zone,
    tle_age integer,
    cospar_id character varying(100),
    object_class character varying(100),
    launch_mass double precision,
    shape text,
    dimensions character varying(100),
    span double precision,
    mission text,
    first_epoch date,
    operator character varying(100),
    manufacturer character varying(100),
    contractor character varying(100),
    bus character varying(100),
    configuration character varying(100),
    purpose text,
    power text,
    motor text,
    length double precision,
    diameter double precision,
    dry_mass double precision,
    equipment text,
    adcs text,
    payload text,
    constellation_name text,
    lifetime text,
    color text,
    material_composition text,
    major_events text,
    related_satellites text,
    transmitter_frequencies text,
    sources text,
    reference_urls text,
    summary text,
    anomaly_flags character varying(100),
    last_reviewed timestamp without time zone,
    pred_decay_date date,
    has_discos_data boolean DEFAULT false NOT NULL,
    has_keeptrack_data boolean DEFAULT false NOT NULL,
    has_spacetrack_data boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: satellite_sync_error_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.satellite_sync_error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id character varying(50) NOT NULL,
    norad_id character varying(10) NOT NULL,
    name character varying(200),
    source character varying(20) NOT NULL,
    error_type character varying(30) NOT NULL,
    error_message text NOT NULL,
    raw_tle text,
    "timestamp" timestamp without time zone NOT NULL,
    error_details jsonb
);


--
-- Name: satellite_sync_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.satellite_sync_tasks (
    id character varying(50) NOT NULL,
    type character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    processed integer DEFAULT 0 NOT NULL,
    success integer DEFAULT 0 NOT NULL,
    failed integer DEFAULT 0 NOT NULL,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    error text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: satellite_tle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.satellite_tle (
    norad_id character varying(50) NOT NULL,
    source character varying(20) DEFAULT 'celestrak'::character varying NOT NULL,
    name character varying(100) NOT NULL,
    line1 text NOT NULL,
    line2 text NOT NULL,
    epoch timestamp without time zone,
    inclination double precision,
    raan double precision,
    eccentricity double precision,
    arg_of_perigee double precision,
    mean_motion double precision,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan public.subscription_plan NOT NULL,
    status public.subscription_status DEFAULT 'pending'::public.subscription_status NOT NULL,
    price numeric(10,2) NOT NULL,
    currency character varying(10) DEFAULT 'CNY'::character varying NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    payment_id character varying(100),
    payment_method character varying(50),
    auto_renew boolean DEFAULT false NOT NULL,
    cancelled_at timestamp without time zone,
    cancel_reason character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    target_id character varying(100) NOT NULL,
    type public.favorite_type NOT NULL,
    note character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(20),
    password character varying(255) NOT NULL,
    avatar character varying(500),
    nickname character varying(100),
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    level character varying(50) DEFAULT 'basic'::public.user_level NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp without time zone,
    last_login_ip character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: article_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_likes ALTER COLUMN id SET DEFAULT nextval('public.article_likes_id_seq'::regclass);


--
-- Name: company id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company ALTER COLUMN id SET DEFAULT nextval('public.company_id_seq'::regclass);


--
-- Name: education_articles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_articles ALTER COLUMN id SET DEFAULT nextval('public.education_articles_id_seq'::regclass);


--
-- Name: education_quiz_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_quiz_answers ALTER COLUMN id SET DEFAULT nextval('public.education_quiz_answers_id_seq'::regclass);


--
-- Name: education_quizzes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_quizzes ALTER COLUMN id SET DEFAULT nextval('public.education_quizzes_id_seq'::regclass);


--
-- Name: intelligence_collects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_collects ALTER COLUMN id SET DEFAULT nextval('public.intelligence_collects_id_seq'::regclass);


--
-- Name: intelligences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligences ALTER COLUMN id SET DEFAULT nextval('public.intelligences_id_seq'::regclass);


--
-- Name: milestones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.milestones ALTER COLUMN id SET DEFAULT nextval('public.milestones_id_seq'::regclass);


--
-- Name: article_likes article_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_likes
    ADD CONSTRAINT article_likes_pkey PRIMARY KEY (id);


--
-- Name: benefits benefits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benefits
    ADD CONSTRAINT benefits_pkey PRIMARY KEY (id);


--
-- Name: company company_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_name_unique UNIQUE (name);


--
-- Name: company company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (id);


--
-- Name: education_article_collects education_article_collects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_article_collects
    ADD CONSTRAINT education_article_collects_pkey PRIMARY KEY (id);


--
-- Name: education_articles education_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_articles
    ADD CONSTRAINT education_articles_pkey PRIMARY KEY (id);


--
-- Name: education_quiz_answers education_quiz_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_quiz_answers
    ADD CONSTRAINT education_quiz_answers_pkey PRIMARY KEY (id);


--
-- Name: education_quizzes education_quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_quizzes
    ADD CONSTRAINT education_quizzes_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: intelligence_collects intelligence_collects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_collects
    ADD CONSTRAINT intelligence_collects_pkey PRIMARY KEY (id);


--
-- Name: intelligences intelligences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligences
    ADD CONSTRAINT intelligences_pkey PRIMARY KEY (id);


--
-- Name: level_benefits level_benefits_level_id_benefit_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.level_benefits
    ADD CONSTRAINT level_benefits_level_id_benefit_id_key UNIQUE (level_id, benefit_id);


--
-- Name: level_benefits level_benefits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.level_benefits
    ADD CONSTRAINT level_benefits_pkey PRIMARY KEY (id);


--
-- Name: member_levels member_levels_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_levels
    ADD CONSTRAINT member_levels_code_key UNIQUE (code);


--
-- Name: member_levels member_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_levels
    ADD CONSTRAINT member_levels_pkey PRIMARY KEY (id);


--
-- Name: membership_plans membership_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_plans
    ADD CONSTRAINT membership_plans_pkey PRIMARY KEY (id);


--
-- Name: membership_plans membership_plans_plan_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_plans
    ADD CONSTRAINT membership_plans_plan_code_key UNIQUE (plan_code);


--
-- Name: milestones milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT milestones_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: points_records points_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_records
    ADD CONSTRAINT points_records_pkey PRIMARY KEY (id);


--
-- Name: push_records push_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_records
    ADD CONSTRAINT push_records_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: satellite_metadata satellite_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.satellite_metadata
    ADD CONSTRAINT satellite_metadata_pkey PRIMARY KEY (norad_id);


--
-- Name: satellite_sync_error_logs satellite_sync_error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.satellite_sync_error_logs
    ADD CONSTRAINT satellite_sync_error_logs_pkey PRIMARY KEY (id);


--
-- Name: satellite_sync_tasks satellite_sync_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.satellite_sync_tasks
    ADD CONSTRAINT satellite_sync_tasks_pkey PRIMARY KEY (id);


--
-- Name: satellite_tle satellite_tle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.satellite_tle
    ADD CONSTRAINT satellite_tle_pkey PRIMARY KEY (norad_id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_favorites user_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_phone_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_unique UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: company_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX company_country_idx ON public.company USING btree (country);


--
-- Name: company_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX company_name_idx ON public.company USING btree (name);


--
-- Name: idx_benefits_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_benefits_sort_order ON public.benefits USING btree (sort_order);


--
-- Name: idx_level_benefits_benefit_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_level_benefits_benefit_id ON public.level_benefits USING btree (benefit_id);


--
-- Name: idx_level_benefits_level_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_level_benefits_level_id ON public.level_benefits USING btree (level_id);


--
-- Name: idx_member_levels_is_default; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_member_levels_is_default ON public.member_levels USING btree (is_default);


--
-- Name: idx_member_levels_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_member_levels_sort_order ON public.member_levels USING btree (sort_order);


--
-- Name: milestones_event_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX milestones_event_date_idx ON public.milestones USING btree (event_date);


--
-- Name: notifications_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_id_created_at_idx ON public.notifications USING btree (user_id, created_at);


--
-- Name: notifications_user_id_is_read_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_id_is_read_idx ON public.notifications USING btree (user_id, is_read);


--
-- Name: push_records_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX push_records_user_id_idx ON public.push_records USING btree (user_id);


--
-- Name: push_subscriptions_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions USING btree (user_id);


--
-- Name: satellite_metadata_country_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX satellite_metadata_country_code_idx ON public.satellite_metadata USING btree (country_code);


--
-- Name: satellite_metadata_launch_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX satellite_metadata_launch_date_idx ON public.satellite_metadata USING btree (launch_date);


--
-- Name: satellite_metadata_object_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX satellite_metadata_object_type_idx ON public.satellite_metadata USING btree (object_type);


--
-- Name: satellite_sync_error_logs_error_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX satellite_sync_error_logs_error_type_idx ON public.satellite_sync_error_logs USING btree (error_type);


--
-- Name: satellite_sync_error_logs_norad_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX satellite_sync_error_logs_norad_id_idx ON public.satellite_sync_error_logs USING btree (norad_id);


--
-- Name: satellite_sync_error_logs_task_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX satellite_sync_error_logs_task_id_idx ON public.satellite_sync_error_logs USING btree (task_id);


--
-- Name: satellite_sync_error_logs_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX satellite_sync_error_logs_timestamp_idx ON public.satellite_sync_error_logs USING btree ("timestamp");


--
-- Name: satellite_sync_tasks_started_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX satellite_sync_tasks_started_at_idx ON public.satellite_sync_tasks USING btree (started_at);


--
-- Name: satellite_sync_tasks_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX satellite_sync_tasks_status_idx ON public.satellite_sync_tasks USING btree (status);


--
-- Name: satellite_sync_tasks_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX satellite_sync_tasks_type_idx ON public.satellite_sync_tasks USING btree (type);


--
-- Name: satellite_tle_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX satellite_tle_source_idx ON public.satellite_tle USING btree (source);


--
-- Name: satellite_tle_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX satellite_tle_updated_at_idx ON public.satellite_tle USING btree (updated_at);


--
-- Name: user_favorites_user_target_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_favorites_user_target_type_idx ON public.user_favorites USING btree (user_id, target_id, type);


--
-- Name: article_likes article_likes_article_id_education_articles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_likes
    ADD CONSTRAINT article_likes_article_id_education_articles_id_fk FOREIGN KEY (article_id) REFERENCES public.education_articles(id) ON DELETE CASCADE;


--
-- Name: article_likes article_likes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_likes
    ADD CONSTRAINT article_likes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: education_article_collects education_article_collects_article_id_education_articles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_article_collects
    ADD CONSTRAINT education_article_collects_article_id_education_articles_id_fk FOREIGN KEY (article_id) REFERENCES public.education_articles(id) ON DELETE CASCADE;


--
-- Name: education_article_collects education_article_collects_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_article_collects
    ADD CONSTRAINT education_article_collects_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: education_quiz_answers education_quiz_answers_quiz_id_education_quizzes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_quiz_answers
    ADD CONSTRAINT education_quiz_answers_quiz_id_education_quizzes_id_fk FOREIGN KEY (quiz_id) REFERENCES public.education_quizzes(id) ON DELETE CASCADE;


--
-- Name: education_quiz_answers education_quiz_answers_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_quiz_answers
    ADD CONSTRAINT education_quiz_answers_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: intelligence_collects intelligence_collects_intelligence_id_intelligences_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_collects
    ADD CONSTRAINT intelligence_collects_intelligence_id_intelligences_id_fk FOREIGN KEY (intelligence_id) REFERENCES public.intelligences(id) ON DELETE CASCADE;


--
-- Name: intelligence_collects intelligence_collects_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_collects
    ADD CONSTRAINT intelligence_collects_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: level_benefits level_benefits_benefit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.level_benefits
    ADD CONSTRAINT level_benefits_benefit_id_fkey FOREIGN KEY (benefit_id) REFERENCES public.benefits(id) ON DELETE CASCADE;


--
-- Name: level_benefits level_benefits_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.level_benefits
    ADD CONSTRAINT level_benefits_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.member_levels(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: points_records points_records_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_records
    ADD CONSTRAINT points_records_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: push_records push_records_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_records
    ADD CONSTRAINT push_records_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


