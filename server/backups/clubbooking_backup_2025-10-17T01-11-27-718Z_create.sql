--
-- PostgreSQL database dump
--

\restrict csmekWAA2lUj3uvstYZjUJyqmsvIderb0iIwpHac73NKUTyVfLpAbonrjtxv3zX

-- Dumped from database version 16.10 (Homebrew)
-- Dumped by pg_dump version 16.10 (Homebrew)

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

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: update_conversation_timestamp(); Type: FUNCTION; Schema: public; Owner: leolopez-linquet
--

CREATE FUNCTION public.update_conversation_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_conversation_timestamp() OWNER TO "leolopez-linquet";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _migrations_applied; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public._migrations_applied (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public._migrations_applied OWNER TO "leolopez-linquet";

--
-- Name: _migrations_applied_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public._migrations_applied_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._migrations_applied_id_seq OWNER TO "leolopez-linquet";

--
-- Name: _migrations_applied_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public._migrations_applied_id_seq OWNED BY public._migrations_applied.id;


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.announcements (
    id bigint NOT NULL,
    club_id bigint NOT NULL,
    manager_id bigint NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    send_push boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.announcements OWNER TO "leolopez-linquet";

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.announcements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO "leolopez-linquet";

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    club_id integer NOT NULL,
    court_id integer NOT NULL,
    user_id integer NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL
);


ALTER TABLE public.bookings OWNER TO "leolopez-linquet";

--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bookings_id_seq OWNER TO "leolopez-linquet";

--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: club_invitations; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.club_invitations (
    id bigint NOT NULL,
    club_id bigint NOT NULL,
    invited_user_id bigint NOT NULL,
    invited_by bigint NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.club_invitations OWNER TO "leolopez-linquet";

--
-- Name: club_invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.club_invitations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.club_invitations_id_seq OWNER TO "leolopez-linquet";

--
-- Name: club_invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.club_invitations_id_seq OWNED BY public.club_invitations.id;


--
-- Name: club_join_requests; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.club_join_requests (
    id bigint NOT NULL,
    club_id bigint NOT NULL,
    user_id bigint NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.club_join_requests OWNER TO "leolopez-linquet";

--
-- Name: club_join_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.club_join_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.club_join_requests_id_seq OWNER TO "leolopez-linquet";

--
-- Name: club_join_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.club_join_requests_id_seq OWNED BY public.club_join_requests.id;


--
-- Name: club_sports; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.club_sports (
    id bigint NOT NULL,
    club_id bigint NOT NULL,
    sport text DEFAULT 'tennis'::text NOT NULL,
    courts integer DEFAULT 1 NOT NULL,
    slot_minutes integer DEFAULT 60 NOT NULL,
    open_hour integer DEFAULT 9 NOT NULL,
    close_hour integer DEFAULT 21 NOT NULL
);


ALTER TABLE public.club_sports OWNER TO "leolopez-linquet";

--
-- Name: club_sports_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.club_sports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.club_sports_id_seq OWNER TO "leolopez-linquet";

--
-- Name: club_sports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.club_sports_id_seq OWNED BY public.club_sports.id;


--
-- Name: clubs; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.clubs (
    id integer NOT NULL,
    name text NOT NULL,
    city text,
    state text,
    sport text DEFAULT 'tennis'::text NOT NULL,
    manager_id bigint,
    code text,
    timezone text,
    auto_approve_join boolean DEFAULT false NOT NULL
);


ALTER TABLE public.clubs OWNER TO "leolopez-linquet";

--
-- Name: clubs_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.clubs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clubs_id_seq OWNER TO "leolopez-linquet";

--
-- Name: clubs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.clubs_id_seq OWNED BY public.clubs.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    club_id integer NOT NULL,
    user_a integer NOT NULL,
    user_b integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT conversations_user_order CHECK ((user_a < user_b))
);


ALTER TABLE public.conversations OWNER TO "leolopez-linquet";

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO "leolopez-linquet";

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: courts; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.courts (
    id integer NOT NULL,
    club_id integer NOT NULL,
    label text NOT NULL
);


ALTER TABLE public.courts OWNER TO "leolopez-linquet";

--
-- Name: courts_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.courts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courts_id_seq OWNER TO "leolopez-linquet";

--
-- Name: courts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.courts_id_seq OWNED BY public.courts.id;


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.feedback (
    id bigint NOT NULL,
    user_id bigint,
    club_id bigint,
    rating smallint,
    category text NOT NULL,
    message text NOT NULL,
    allow_contact boolean DEFAULT true NOT NULL,
    email text,
    attachment_url text,
    app_version text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    handled_at timestamp with time zone,
    status text DEFAULT 'new'::text NOT NULL,
    CONSTRAINT feedback_category_check CHECK ((category = ANY (ARRAY['bug'::text, 'ux'::text, 'feature'::text, 'other'::text]))),
    CONSTRAINT feedback_email_valid CHECK (((email IS NULL) OR (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))),
    CONSTRAINT feedback_message_check CHECK (((length(message) >= 10) AND (length(message) <= 2000))),
    CONSTRAINT feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT feedback_status_check CHECK ((status = ANY (ARRAY['new'::text, 'in_progress'::text, 'resolved'::text, 'dismissed'::text])))
);


ALTER TABLE public.feedback OWNER TO "leolopez-linquet";

--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_id_seq OWNER TO "leolopez-linquet";

--
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- Name: looking; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.looking (
    id bigint NOT NULL,
    club_id bigint NOT NULL,
    user_id bigint NOT NULL,
    player_id bigint,
    display_name text NOT NULL,
    looking_since timestamp without time zone DEFAULT now(),
    looking_from text,
    looking_to text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.looking OWNER TO "leolopez-linquet";

--
-- Name: looking_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.looking_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.looking_id_seq OWNER TO "leolopez-linquet";

--
-- Name: looking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.looking_id_seq OWNED BY public.looking.id;


--
-- Name: matches; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    tournament_id integer NOT NULL,
    round integer NOT NULL,
    slot integer NOT NULL,
    p1_id integer,
    p2_id integer,
    winner_id integer,
    score text,
    p1_score integer,
    p2_score integer,
    status text
);


ALTER TABLE public.matches OWNER TO "leolopez-linquet";

--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matches_id_seq OWNER TO "leolopez-linquet";

--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- Name: message_reads; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.message_reads (
    id bigint NOT NULL,
    message_id integer NOT NULL,
    user_id integer NOT NULL,
    read_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.message_reads OWNER TO "leolopez-linquet";

--
-- Name: message_reads_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.message_reads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.message_reads_id_seq OWNER TO "leolopez-linquet";

--
-- Name: message_reads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.message_reads_id_seq OWNED BY public.message_reads.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT messages_body_not_empty CHECK ((length(TRIM(BOTH FROM body)) > 0))
);


ALTER TABLE public.messages OWNER TO "leolopez-linquet";

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO "leolopez-linquet";

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: players; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.players (
    id integer NOT NULL,
    club_id integer NOT NULL,
    user_id integer,
    display_name text NOT NULL,
    looking_for_partner boolean DEFAULT false,
    looking_since timestamp with time zone
);


ALTER TABLE public.players OWNER TO "leolopez-linquet";

--
-- Name: players_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.players_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.players_id_seq OWNER TO "leolopez-linquet";

--
-- Name: players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.players_id_seq OWNED BY public.players.id;


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.push_subscriptions (
    id bigint NOT NULL,
    user_id bigint,
    endpoint text NOT NULL,
    p256dh text,
    auth text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.push_subscriptions OWNER TO "leolopez-linquet";

--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.push_subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.push_subscriptions_id_seq OWNER TO "leolopez-linquet";

--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;


--
-- Name: standings; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.standings (
    id integer NOT NULL,
    club_id integer NOT NULL,
    player_id integer NOT NULL,
    tournaments_played integer DEFAULT 0 NOT NULL,
    matches_won integer DEFAULT 0 NOT NULL,
    matches_lost integer DEFAULT 0 NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.standings OWNER TO "leolopez-linquet";

--
-- Name: standings_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.standings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.standings_id_seq OWNER TO "leolopez-linquet";

--
-- Name: standings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.standings_id_seq OWNED BY public.standings.id;


--
-- Name: tournament_player_points; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.tournament_player_points (
    tournament_id integer NOT NULL,
    player_id integer NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    placement integer
);


ALTER TABLE public.tournament_player_points OWNER TO "leolopez-linquet";

--
-- Name: tournament_players; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.tournament_players (
    id integer NOT NULL,
    tournament_id integer NOT NULL,
    player_id integer NOT NULL,
    seed integer
);


ALTER TABLE public.tournament_players OWNER TO "leolopez-linquet";

--
-- Name: tournament_players_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.tournament_players_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tournament_players_id_seq OWNER TO "leolopez-linquet";

--
-- Name: tournament_players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.tournament_players_id_seq OWNED BY public.tournament_players.id;


--
-- Name: tournament_points; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.tournament_points (
    id integer NOT NULL,
    tournament_id integer NOT NULL,
    player_id integer NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    placement integer
);


ALTER TABLE public.tournament_points OWNER TO "leolopez-linquet";

--
-- Name: tournament_points_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.tournament_points_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tournament_points_id_seq OWNER TO "leolopez-linquet";

--
-- Name: tournament_points_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.tournament_points_id_seq OWNED BY public.tournament_points.id;


--
-- Name: tournament_registrations; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.tournament_registrations (
    id bigint NOT NULL,
    tournament_id bigint NOT NULL,
    user_id bigint NOT NULL,
    registered_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tournament_registrations OWNER TO "leolopez-linquet";

--
-- Name: tournament_registrations_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.tournament_registrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tournament_registrations_id_seq OWNER TO "leolopez-linquet";

--
-- Name: tournament_registrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.tournament_registrations_id_seq OWNED BY public.tournament_registrations.id;


--
-- Name: tournaments; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.tournaments (
    id integer NOT NULL,
    club_id integer NOT NULL,
    name text NOT NULL,
    sport text NOT NULL,
    end_date date,
    points_by_round text,
    seeds_count integer,
    draw_size integer
);


ALTER TABLE public.tournaments OWNER TO "leolopez-linquet";

--
-- Name: tournaments_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.tournaments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tournaments_id_seq OWNER TO "leolopez-linquet";

--
-- Name: tournaments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.tournaments_id_seq OWNED BY public.tournaments.id;


--
-- Name: user_announcements; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.user_announcements (
    id bigint NOT NULL,
    announcement_id bigint NOT NULL,
    user_id bigint NOT NULL,
    read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_announcements OWNER TO "leolopez-linquet";

--
-- Name: user_announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.user_announcements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_announcements_id_seq OWNER TO "leolopez-linquet";

--
-- Name: user_announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.user_announcements_id_seq OWNED BY public.user_announcements.id;


--
-- Name: user_clubs; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.user_clubs (
    user_id bigint NOT NULL,
    club_id bigint NOT NULL,
    role text DEFAULT 'player'::text NOT NULL
);


ALTER TABLE public.user_clubs OWNER TO "leolopez-linquet";

--
-- Name: users; Type: TABLE; Schema: public; Owner: leolopez-linquet
--

CREATE TABLE public.users (
    id integer NOT NULL,
    display_name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    email_verified_at timestamp with time zone,
    username text,
    role text DEFAULT 'player'::text,
    is_manager boolean DEFAULT false,
    active_club_id integer
);


ALTER TABLE public.users OWNER TO "leolopez-linquet";

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: leolopez-linquet
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO "leolopez-linquet";

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: leolopez-linquet
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: _migrations_applied id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public._migrations_applied ALTER COLUMN id SET DEFAULT nextval('public._migrations_applied_id_seq'::regclass);


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: club_invitations id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.club_invitations ALTER COLUMN id SET DEFAULT nextval('public.club_invitations_id_seq'::regclass);


--
-- Name: club_join_requests id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.club_join_requests ALTER COLUMN id SET DEFAULT nextval('public.club_join_requests_id_seq'::regclass);


--
-- Name: club_sports id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.club_sports ALTER COLUMN id SET DEFAULT nextval('public.club_sports_id_seq'::regclass);


--
-- Name: clubs id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.clubs ALTER COLUMN id SET DEFAULT nextval('public.clubs_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: courts id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.courts ALTER COLUMN id SET DEFAULT nextval('public.courts_id_seq'::regclass);


--
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- Name: looking id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.looking ALTER COLUMN id SET DEFAULT nextval('public.looking_id_seq'::regclass);


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: message_reads id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.message_reads ALTER COLUMN id SET DEFAULT nextval('public.message_reads_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: players id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.players ALTER COLUMN id SET DEFAULT nextval('public.players_id_seq'::regclass);


--
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- Name: standings id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.standings ALTER COLUMN id SET DEFAULT nextval('public.standings_id_seq'::regclass);


--
-- Name: tournament_players id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_players ALTER COLUMN id SET DEFAULT nextval('public.tournament_players_id_seq'::regclass);


--
-- Name: tournament_points id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_points ALTER COLUMN id SET DEFAULT nextval('public.tournament_points_id_seq'::regclass);


--
-- Name: tournament_registrations id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_registrations ALTER COLUMN id SET DEFAULT nextval('public.tournament_registrations_id_seq'::regclass);


--
-- Name: tournaments id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournaments ALTER COLUMN id SET DEFAULT nextval('public.tournaments_id_seq'::regclass);


--
-- Name: user_announcements id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.user_announcements ALTER COLUMN id SET DEFAULT nextval('public.user_announcements_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _migrations_applied; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public._migrations_applied (id, filename, applied_at) FROM stdin;
1	000_extensions.sql	2025-10-15 21:01:46.382867-05
2	001_init.sql	2025-10-15 21:02:17.724573-05
3	002_seed_courts.sql	2025-10-15 21:02:17.726077-05
4	006_players_and_points_reset.sql	2025-10-15 21:02:17.740297-05
5	007_add_user_columns.sql	2025-10-15 21:02:17.744471-05
6	008_add_club_columns.sql	2025-10-15 21:02:17.747376-05
7	009_create_club_sports.sql	2025-10-15 21:02:17.747974-05
8	010_add_club_timezone.sql	2025-10-15 21:02:17.749249-05
9	011_create_announcements.sql	2025-10-15 21:02:17.749656-05
10	012_club_requests_invitations.sql	2025-10-15 21:02:17.749991-05
11	013_create_chat_tables.sql	2025-10-15 21:02:35.450236-05
12	014_create_feedback.sql	2025-10-16 19:43:24.680229-05
13	016_create_message_reads.sql	2025-10-16 19:43:24.683252-05
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.announcements (id, club_id, manager_id, title, body, send_push, created_at) FROM stdin;
1	2	1	hekki	h	f	2025-09-28 23:08:40.813831-05
2	2	1	Test notice	Hello members	f	2025-09-28 23:08:57.465796-05
3	2	2	Announcement	Hello world	f	2025-09-29 10:15:55.873892-05
4	2	2	a	a	f	2025-09-29 10:15:59.379049-05
5	2	2	s	s	f	2025-09-29 10:16:02.782446-05
6	2	2	g	g	f	2025-09-29 10:16:10.465054-05
7	2	2	Test Announcement	This is a test announcement to verify the feature works.	f	2025-09-29 11:57:58.271227-05
8	2	2	Hello	Hello	f	2025-09-29 18:38:59.288381-05
9	2	2	Announcement	Hello world	f	2025-10-02 10:01:14.947261-05
10	2	2	Testing	1234	f	2025-10-03 21:46:07.904978-05
11	2	2	Test	Test	f	2025-10-05 23:21:18.049374-05
12	2	2	Test2	Hello	f	2025-10-06 10:33:09.469465-05
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.bookings (id, club_id, court_id, user_id, starts_at, ends_at) FROM stdin;
\.


--
-- Data for Name: club_invitations; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.club_invitations (id, club_id, invited_user_id, invited_by, status, created_at) FROM stdin;
\.


--
-- Data for Name: club_join_requests; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.club_join_requests (id, club_id, user_id, status, created_at) FROM stdin;
7	1	32	pending	2025-10-09 21:28:56.712522-05
\.


--
-- Data for Name: club_sports; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.club_sports (id, club_id, sport, courts, slot_minutes, open_hour, close_hour) FROM stdin;
14	12	tennis	4	60	8	22
13	11	soccer	18	60	8	22
15	13	soccer	6	60	10	18
16	13	tennis	4	60	8	22
\.


--
-- Data for Name: clubs; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.clubs (id, name, city, state, sport, manager_id, code, timezone, auto_approve_join) FROM stdin;
1	Local Test Club	Lincoln	NE	tennis	\N	\N	\N	f
13	Huskers	\N	\N	tennis	1	ZQ7A6X	America/Chicago	t
11	Hacoaj	\N	\N	tennis	1	SSBECD	America/Chicago	t
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.conversations (id, club_id, user_a, user_b, created_at, updated_at) FROM stdin;
2	1	1	7	2025-10-10 20:58:53.30661-05	2025-10-10 20:59:02.115494-05
1	1	6	7	2025-10-10 20:56:25.259363-05	2025-10-10 23:20:13.902553-05
3	1	6	34	2025-10-10 23:24:56.504417-05	2025-10-10 23:25:01.02001-05
4	1	6	29	2025-10-10 23:25:47.282356-05	2025-10-10 23:25:49.952867-05
5	1	1	6	2025-10-10 23:31:22.639789-05	2025-10-10 23:31:43.20026-05
6	11	1	4	2025-10-14 22:52:34.828219-05	2025-10-15 19:29:13.810885-05
7	11	3	4	2025-10-15 19:29:21.862623-05	2025-10-15 19:29:25.456404-05
9	13	1	4	2025-10-15 19:36:53.90634-05	2025-10-15 19:36:58.561876-05
8	11	1	3	2025-10-15 19:29:50.863815-05	2025-10-15 20:32:45.279208-05
10	11	1	5	2025-10-15 20:40:36.760917-05	2025-10-15 20:41:12.521679-05
\.


--
-- Data for Name: courts; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.courts (id, club_id, label) FROM stdin;
1	1	Court 1
2	1	Court 2
3	1	Court 3
4	1	Court 4
5	1	Court 5
6	1	Court 6
7	1	Court 7
8	1	Court 8
9	1	Court 9
10	1	Court 10
11	1	Court 11
12	1	Court 12
13	1	Court 13
14	1	Court 14
15	1	Court 15
16	1	Court 16
17	1	Court 17
18	1	Court 18
19	1	Court 19
20	1	Court 20
21	1	Court 21
22	1	Court 22
23	1	Court 23
24	1	Court 24
25	1	Court 25
26	1	Court 26
27	1	Court 27
28	1	Court 28
29	1	Court 29
30	1	Court 30
31	1	Court 31
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.feedback (id, user_id, club_id, rating, category, message, allow_contact, email, attachment_url, app_version, user_agent, created_at, handled_at, status) FROM stdin;
1	\N	2	4	ux	Testing check	t	leolinquet@example.local	\N	1.0.0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-10 23:55:24.346147-05	2025-10-10 23:56:09.565773-05	dismissed
2	\N	2	5	feature	Testing 2 check	t	user1@example.local	\N	1.0.0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-10 23:58:10.345897-05	\N	new
3	\N	2	5	bug	Testing 3 picture	t	user1@example.local	/uploads/feedback/feedback_1760158719389.png	1.0.0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-10 23:58:39.390603-05	\N	new
4	\N	2	4	ux	Testing 4 screenshot	t	user2@example.local	/uploads/feedback/feedback_1760158904439.png	1.0.0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-11 00:01:44.446208-05	\N	new
5	\N	2	4	ux	Test with screen	t	leolinquet@example.local	http://localhost:5051/uploads/feedback/feedback_1760188735165.png	1.0.0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-11 08:18:55.174435-05	\N	new
6	\N	13	4	bug	Report....	t	leolinquet@example.com	\N	1.0.0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-15 19:41:09.792633-05	\N	new
\.


--
-- Data for Name: looking; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.looking (id, club_id, user_id, player_id, display_name, looking_since, looking_from, looking_to, created_at) FROM stdin;
4	1	7	153	user2	2025-10-09 21:42:33.553248	\N	\N	2025-10-09 21:42:33.553248
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.matches (id, tournament_id, round, slot, p1_id, p2_id, winner_id, score, p1_score, p2_score, status) FROM stdin;
\.


--
-- Data for Name: message_reads; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.message_reads (id, message_id, user_id, read_at) FROM stdin;
1	10	1	2025-10-15 20:26:23.352118-05
2	12	3	2025-10-15 20:32:33.277109-05
3	11	3	2025-10-15 20:32:49.691625-05
4	15	1	2025-10-15 20:33:05.813671-05
5	14	1	2025-10-15 20:33:05.813671-05
6	17	1	2025-10-15 20:40:54.139926-05
7	18	1	2025-10-15 20:40:54.139926-05
8	16	1	2025-10-15 20:40:54.139926-05
9	19	5	2025-10-15 20:41:26.470166-05
10	1	1	2025-10-15 20:46:03.064583-05
11	2	1	2025-10-15 20:46:03.064583-05
12	7	1	2025-10-15 20:46:03.064583-05
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.messages (id, conversation_id, sender_id, body, created_at) FROM stdin;
1	2	7	Hello	2025-10-10 20:58:56.752817-05
2	2	7	How are you?	2025-10-10 20:59:02.115494-05
3	1	7	Hello	2025-10-10 21:08:54.415933-05
4	1	6	Hey	2025-10-10 23:20:13.902553-05
5	3	6	Hello	2025-10-10 23:25:01.02001-05
6	4	6	Hi	2025-10-10 23:25:49.952867-05
7	5	6	Check 123	2025-10-10 23:31:27.168551-05
8	5	1	Hello	2025-10-10 23:31:43.20026-05
9	6	1	Hello	2025-10-15 19:27:09.452343-05
10	6	4	Hi	2025-10-15 19:29:13.810885-05
11	7	4	Hello	2025-10-15 19:29:25.456404-05
12	8	1	Hello	2025-10-15 19:29:53.393888-05
13	9	1	Hello	2025-10-15 19:36:58.561876-05
14	8	3	Hello	2025-10-15 20:32:38.295711-05
15	8	3	This is a test	2025-10-15 20:32:45.279208-05
16	10	5	Hello	2025-10-15 20:40:40.641072-05
17	10	5	Test	2025-10-15 20:40:43.436648-05
18	10	5	1234	2025-10-15 20:40:45.322905-05
19	10	1	Hi	2025-10-15 20:41:12.521679-05
\.


--
-- Data for Name: players; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.players (id, club_id, user_id, display_name, looking_for_partner, looking_since) FROM stdin;
146	2	15	user11	f	\N
150	1	1	leolinquet	f	\N
152	1	6	user1	f	\N
153	1	7	user2	f	\N
154	1	8	user3	f	\N
155	1	9	user4	f	\N
156	1	29	user5	f	\N
4	2	1	leolinquet	f	\N
140	2	8	user3	f	\N
165	2	9	user4	f	\N
166	2	29	user5	f	\N
167	2	30	user6	f	\N
67	4	2	user	f	\N
68	4	3	Maddy	f	\N
69	3	2	user	f	\N
70	3	3	Maddy	f	\N
71	3	4	asfgafga	f	\N
72	3	5	dafs	f	\N
73	3	7	user2	f	\N
134	3	16	colson	f	\N
1	2	2	user	t	2025-10-02 22:12:23.644-05
2	2	3	Maddy	t	2025-09-29 20:50:00.6-05
25	2	6	user1	f	\N
3	2	4	asfgafga	t	2025-10-02 22:14:15.746-05
8	2	5	dafs	t	2025-10-02 22:14:36.843-05
78	2	7	user2	f	\N
141	2	10	Joan	f	\N
142	2	11	MENS TENNIS	f	\N
143	2	12	henry	f	\N
144	2	13	leo	f	\N
145	2	14	niko	f	\N
147	2	16	colson	f	\N
148	2	17	paula	f	\N
168	2	31	user7	f	\N
169	2	32	user8	f	\N
170	2	33	user9	f	\N
171	2	34	user10	f	\N
174	11	3	user17	f	\N
172	11	1	leolinquet	f	\N
175	11	4	user1	f	\N
176	11	5	user2	f	\N
184	13	4	user1	f	\N
185	13	1	leolinquet	f	\N
186	13	5	user2	f	\N
\.


--
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at) FROM stdin;
\.


--
-- Data for Name: standings; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.standings (id, club_id, player_id, tournaments_played, matches_won, matches_lost, points, updated_at) FROM stdin;
\.


--
-- Data for Name: tournament_player_points; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.tournament_player_points (tournament_id, player_id, points, placement) FROM stdin;
1	4	200	\N
1	3	20	\N
1	2	20	\N
1	1	40	\N
6	1	200	\N
6	25	20	\N
6	3	40	\N
6	2	20	\N
11	3	70	\N
11	1	200	\N
11	2	70	\N
11	8	120	\N
12	2	45	\N
12	8	70	\N
12	1	210	\N
12	3	45	\N
13	1	200	\N
13	2	70	\N
13	3	70	\N
13	8	120	\N
10	1	200	\N
10	2	70	\N
10	3	70	\N
10	8	120	\N
14	1	200	\N
14	3	20	\N
14	2	40	\N
14	8	20	\N
15	1	200	\N
15	3	70	\N
15	2	70	\N
15	8	120	\N
28	1	200	\N
28	8	40	\N
28	2	40	\N
28	3	70	\N
28	78	20	\N
29	1	120	\N
29	8	200	\N
29	3	0	\N
29	2	120	\N
29	78	70	\N
30	1	200	\N
30	8	120	\N
30	140	40	\N
30	78	20	\N
30	141	40	\N
30	145	20	\N
30	143	40	\N
30	142	70	\N
30	2	70	\N
30	146	40	\N
30	148	20	\N
30	144	20	\N
30	147	20	\N
30	3	20	\N
2	150	200	\N
2	152	120	\N
2	156	70	\N
2	153	40	\N
2	154	70	\N
2	155	40	\N
3	4	200	\N
3	140	40	\N
3	78	70	\N
3	171	40	\N
3	25	120	\N
3	165	40	\N
3	170	20	\N
3	169	20	\N
3	167	70	\N
3	166	20	\N
3	168	40	\N
2	172	200	\N
2	176	70	\N
2	174	120	\N
2	175	70	\N
3	172	200	\N
3	176	40	\N
3	175	20	\N
4	185	200	\N
4	186	40	\N
4	184	20	\N
\.


--
-- Data for Name: tournament_players; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.tournament_players (id, tournament_id, player_id, seed) FROM stdin;
\.


--
-- Data for Name: tournament_points; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.tournament_points (id, tournament_id, player_id, points, placement) FROM stdin;
\.


--
-- Data for Name: tournament_registrations; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.tournament_registrations (id, tournament_id, user_id, registered_at) FROM stdin;
\.


--
-- Data for Name: tournaments; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.tournaments (id, club_id, name, sport, end_date, points_by_round, seeds_count, draw_size) FROM stdin;
\.


--
-- Data for Name: user_announcements; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.user_announcements (id, announcement_id, user_id, read, read_at, created_at) FROM stdin;
3	1	4	f	\N	2025-09-28 23:08:40.81993-05
4	1	2	f	\N	2025-09-28 23:08:40.820694-05
1	1	1	t	2025-09-28 23:08:49.206343-05	2025-09-28 23:08:40.817428-05
7	2	4	f	\N	2025-09-28 23:08:57.467409-05
8	2	2	t	2025-09-28 23:21:24.510921-05	2025-09-28 23:08:57.467565-05
11	3	4	f	\N	2025-09-29 10:15:55.880293-05
12	3	2	f	\N	2025-09-29 10:15:55.880726-05
15	4	4	f	\N	2025-09-29 10:15:59.38233-05
16	4	2	f	\N	2025-09-29 10:15:59.382796-05
19	5	4	f	\N	2025-09-29 10:16:02.784653-05
20	5	2	f	\N	2025-09-29 10:16:02.785378-05
23	6	4	f	\N	2025-09-29 10:16:10.467189-05
24	6	2	f	\N	2025-09-29 10:16:10.467683-05
27	7	5	f	\N	2025-09-29 11:57:58.27472-05
28	7	4	f	\N	2025-09-29 11:57:58.275062-05
29	7	2	t	2025-09-29 15:16:14.053953-05	2025-09-29 11:57:58.275384-05
32	8	5	f	\N	2025-09-29 18:38:59.294733-05
33	8	4	f	\N	2025-09-29 18:38:59.295217-05
34	8	2	f	\N	2025-09-29 18:38:59.295888-05
37	9	5	f	\N	2025-10-02 10:01:14.953143-05
38	9	4	f	\N	2025-10-02 10:01:14.954174-05
39	9	2	f	\N	2025-10-02 10:01:14.954692-05
42	10	5	f	\N	2025-10-03 21:46:07.910981-05
43	10	4	f	\N	2025-10-03 21:46:07.911761-05
44	10	2	t	2025-10-03 21:46:09.762543-05	2025-10-03 21:46:07.912287-05
45	11	8	f	\N	2025-10-05 23:21:18.05284-05
46	11	10	f	\N	2025-10-05 23:21:18.053874-05
47	11	7	f	\N	2025-10-05 23:21:18.054238-05
49	11	5	f	\N	2025-10-05 23:21:18.055424-05
50	11	4	f	\N	2025-10-05 23:21:18.05583-05
53	12	8	f	\N	2025-10-06 10:33:09.471836-05
54	12	10	f	\N	2025-10-06 10:33:09.473827-05
58	12	4	f	\N	2025-10-06 10:33:09.47623-05
60	12	16	f	\N	2025-10-06 10:33:09.477177-05
51	11	2	t	2025-10-06 10:52:03.305987-05	2025-10-05 23:21:18.056083-05
59	12	2	t	2025-10-06 10:52:04.736429-05	2025-10-06 10:33:09.476585-05
55	12	7	t	2025-10-09 21:50:20.971786-05	2025-10-06 10:33:09.474598-05
56	12	1	t	2025-10-15 20:24:10.894707-05	2025-10-06 10:33:09.475354-05
48	11	1	t	2025-10-15 20:24:12.358225-05	2025-10-05 23:21:18.054805-05
40	10	1	t	2025-10-15 20:24:13.526545-05	2025-10-03 21:46:07.908524-05
35	9	1	t	2025-10-15 20:24:14.224418-05	2025-10-02 10:01:14.94987-05
30	8	1	t	2025-10-15 20:24:16.193731-05	2025-09-29 18:38:59.292139-05
21	6	1	t	2025-10-15 20:24:20.324694-05	2025-09-29 10:16:10.466182-05
17	5	1	t	2025-10-15 20:24:20.927425-05	2025-09-29 10:16:02.783691-05
25	7	1	t	2025-10-15 20:24:22.160028-05	2025-09-29 11:57:58.273312-05
13	4	1	t	2025-10-15 20:24:23.410371-05	2025-09-29 10:15:59.380735-05
9	3	1	t	2025-10-15 20:24:23.894156-05	2025-09-29 10:15:55.877609-05
5	2	1	t	2025-10-15 20:24:24.806376-05	2025-09-28 23:08:57.466595-05
61	12	3	t	2025-10-15 20:32:14.841463-05	2025-10-06 10:33:09.477731-05
52	11	3	t	2025-10-15 20:32:15.871956-05	2025-10-05 23:21:18.05633-05
41	10	3	t	2025-10-15 20:32:16.621961-05	2025-10-03 21:46:07.910183-05
36	9	3	t	2025-10-15 20:32:18.076423-05	2025-10-02 10:01:14.95157-05
2	1	3	t	2025-10-15 20:32:19.741985-05	2025-09-28 23:08:40.819397-05
6	2	3	t	2025-10-15 20:32:20.792333-05	2025-09-28 23:08:57.466974-05
10	3	3	t	2025-10-15 20:32:22.940485-05	2025-09-29 10:15:55.879639-05
14	4	3	t	2025-10-15 20:32:24.241476-05	2025-09-29 10:15:59.381776-05
18	5	3	t	2025-10-15 20:32:26.225694-05	2025-09-29 10:16:02.78425-05
22	6	3	t	2025-10-15 20:32:27.007815-05	2025-09-29 10:16:10.466747-05
31	8	3	t	2025-10-15 20:32:28.958541-05	2025-09-29 18:38:59.293951-05
26	7	3	t	2025-10-15 20:32:29.723677-05	2025-09-29 11:57:58.274324-05
57	12	5	t	2025-10-15 20:40:28.583976-05	2025-10-06 10:33:09.475802-05
\.


--
-- Data for Name: user_clubs; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.user_clubs (user_id, club_id, role) FROM stdin;
1	11	manager
3	11	player
5	11	player
4	11	player
1	13	manager
4	13	player
6	11	player
7	11	player
5	13	player
2	13	player
2	11	player
8	11	player
9	11	player
10	11	player
11	11	player
12	11	player
13	11	player
14	11	player
15	11	player
16	11	player
17	11	player
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: leolopez-linquet
--

COPY public.users (id, display_name, email, password_hash, email_verified_at, username, role, is_manager, active_club_id) FROM stdin;
1	leolinquet	leolinquet@example.com	$2a$10$9vM1m/GJJUKIn7jVJPk4UO0JtjWCAYjHa/YrrUtIl0TO0QCR7EWhC	2025-10-16 19:47:23.228-05	leolinquet	manager	t	11
3	user2	user2@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
4	user3	user3@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
5	user4	user4@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
6	user5	user5@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
7	user6	user6@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
8	user7	user7@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
9	user8	user8@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
10	user9	user9@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
11	user10	user10@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
12	user11	user11@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
13	user12	user12@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
14	user13	user13@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
15	user14	user14@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
16	user15	user15@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
17	user16	user16@example.com	$2b$10$dummy.hash.for.testing.only	2025-10-16 20:09:12.844084-05	\N	player	f	11
2	user1	user1@example.com	$2a$10$U83Wm0OgSvnOJIE0cPxfAu8dQodOwDxkVUCIjgk7yjsSWkKay68X.	2025-10-16 20:04:01.594579-05	user1	player	f	11
\.


--
-- Name: _migrations_applied_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public._migrations_applied_id_seq', 13, true);


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.announcements_id_seq', 12, true);


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.bookings_id_seq', 1, false);


--
-- Name: club_invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.club_invitations_id_seq', 6, true);


--
-- Name: club_join_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.club_join_requests_id_seq', 13, true);


--
-- Name: club_sports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.club_sports_id_seq', 16, true);


--
-- Name: clubs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.clubs_id_seq', 13, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.conversations_id_seq', 10, true);


--
-- Name: courts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.courts_id_seq', 31, true);


--
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.feedback_id_seq', 6, true);


--
-- Name: looking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.looking_id_seq', 5, true);


--
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.matches_id_seq', 1, false);


--
-- Name: message_reads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.message_reads_id_seq', 12, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.messages_id_seq', 19, true);


--
-- Name: players_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.players_id_seq', 186, true);


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 1, false);


--
-- Name: standings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.standings_id_seq', 1, false);


--
-- Name: tournament_players_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.tournament_players_id_seq', 1, false);


--
-- Name: tournament_points_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.tournament_points_id_seq', 1, false);


--
-- Name: tournament_registrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.tournament_registrations_id_seq', 1, false);


--
-- Name: tournaments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.tournaments_id_seq', 1, false);


--
-- Name: user_announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.user_announcements_id_seq', 61, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: leolopez-linquet
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: _migrations_applied _migrations_applied_filename_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public._migrations_applied
    ADD CONSTRAINT _migrations_applied_filename_key UNIQUE (filename);


--
-- Name: _migrations_applied _migrations_applied_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public._migrations_applied
    ADD CONSTRAINT _migrations_applied_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_court_id_starts_at_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_court_id_starts_at_key UNIQUE (court_id, starts_at);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: club_invitations club_invitations_club_id_invited_user_id_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.club_invitations
    ADD CONSTRAINT club_invitations_club_id_invited_user_id_key UNIQUE (club_id, invited_user_id);


--
-- Name: club_invitations club_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.club_invitations
    ADD CONSTRAINT club_invitations_pkey PRIMARY KEY (id);


--
-- Name: club_join_requests club_join_requests_club_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.club_join_requests
    ADD CONSTRAINT club_join_requests_club_id_user_id_key UNIQUE (club_id, user_id);


--
-- Name: club_join_requests club_join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.club_join_requests
    ADD CONSTRAINT club_join_requests_pkey PRIMARY KEY (id);


--
-- Name: club_sports club_sports_club_id_sport_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.club_sports
    ADD CONSTRAINT club_sports_club_id_sport_key UNIQUE (club_id, sport);


--
-- Name: club_sports club_sports_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.club_sports
    ADD CONSTRAINT club_sports_pkey PRIMARY KEY (id);


--
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_club_id_user_a_user_b_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_club_id_user_a_user_b_key UNIQUE (club_id, user_a, user_b);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: courts courts_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.courts
    ADD CONSTRAINT courts_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: looking looking_club_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.looking
    ADD CONSTRAINT looking_club_id_user_id_key UNIQUE (club_id, user_id);


--
-- Name: looking looking_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.looking
    ADD CONSTRAINT looking_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: message_reads message_reads_message_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_message_id_user_id_key UNIQUE (message_id, user_id);


--
-- Name: message_reads message_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: players players_club_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_club_id_user_id_key UNIQUE (club_id, user_id);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: standings standings_club_id_player_id_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.standings
    ADD CONSTRAINT standings_club_id_player_id_key UNIQUE (club_id, player_id);


--
-- Name: standings standings_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.standings
    ADD CONSTRAINT standings_pkey PRIMARY KEY (id);


--
-- Name: tournament_player_points tournament_player_points_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_player_points
    ADD CONSTRAINT tournament_player_points_pkey PRIMARY KEY (tournament_id, player_id);


--
-- Name: tournament_players tournament_players_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_players
    ADD CONSTRAINT tournament_players_pkey PRIMARY KEY (id);


--
-- Name: tournament_players tournament_players_tournament_id_player_id_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_players
    ADD CONSTRAINT tournament_players_tournament_id_player_id_key UNIQUE (tournament_id, player_id);


--
-- Name: tournament_points tournament_points_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_points
    ADD CONSTRAINT tournament_points_pkey PRIMARY KEY (id);


--
-- Name: tournament_points tournament_points_tournament_id_player_id_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_points
    ADD CONSTRAINT tournament_points_tournament_id_player_id_key UNIQUE (tournament_id, player_id);


--
-- Name: tournament_registrations tournament_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_registrations
    ADD CONSTRAINT tournament_registrations_pkey PRIMARY KEY (id);


--
-- Name: tournament_registrations tournament_registrations_tournament_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_registrations
    ADD CONSTRAINT tournament_registrations_tournament_id_user_id_key UNIQUE (tournament_id, user_id);


--
-- Name: tournaments tournaments_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);


--
-- Name: tournament_registrations uq_tournament_user; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_registrations
    ADD CONSTRAINT uq_tournament_user UNIQUE (tournament_id, user_id);


--
-- Name: user_announcements user_announcements_announcement_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.user_announcements
    ADD CONSTRAINT user_announcements_announcement_id_user_id_key UNIQUE (announcement_id, user_id);


--
-- Name: user_announcements user_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.user_announcements
    ADD CONSTRAINT user_announcements_pkey PRIMARY KEY (id);


--
-- Name: user_clubs user_clubs_user_id_club_id_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.user_clubs
    ADD CONSTRAINT user_clubs_user_id_club_id_key UNIQUE (user_id, club_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: clubs_code_key; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE UNIQUE INDEX clubs_code_key ON public.clubs USING btree (code);


--
-- Name: feedback_category_idx; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX feedback_category_idx ON public.feedback USING btree (category);


--
-- Name: feedback_club_idx; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX feedback_club_idx ON public.feedback USING btree (club_id);


--
-- Name: feedback_created_idx; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX feedback_created_idx ON public.feedback USING btree (created_at DESC);


--
-- Name: feedback_status_idx; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX feedback_status_idx ON public.feedback USING btree (status);


--
-- Name: feedback_user_idx; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX feedback_user_idx ON public.feedback USING btree (user_id);


--
-- Name: idx_bookings_user_starts; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX idx_bookings_user_starts ON public.bookings USING btree (user_id, starts_at);


--
-- Name: idx_ci_club_status; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX idx_ci_club_status ON public.club_invitations USING btree (club_id, status);


--
-- Name: idx_cjr_club_status; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX idx_cjr_club_status ON public.club_join_requests USING btree (club_id, status);


--
-- Name: idx_conversations_club_users; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX idx_conversations_club_users ON public.conversations USING btree (club_id, user_a, user_b);


--
-- Name: idx_conversations_updated_at; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX idx_conversations_updated_at ON public.conversations USING btree (updated_at DESC);


--
-- Name: idx_message_reads_message; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX idx_message_reads_message ON public.message_reads USING btree (message_id);


--
-- Name: idx_message_reads_user; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX idx_message_reads_user ON public.message_reads USING btree (user_id);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id, created_at DESC);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- Name: idx_standings_club_points; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX idx_standings_club_points ON public.standings USING btree (club_id, points DESC, player_id);


--
-- Name: idx_tp_player; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX idx_tp_player ON public.tournament_players USING btree (player_id);


--
-- Name: idx_tp_tournament; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX idx_tp_tournament ON public.tournament_players USING btree (tournament_id);


--
-- Name: idx_tpoints_tournament_player; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE INDEX idx_tpoints_tournament_player ON public.tournament_points USING btree (tournament_id, player_id);


--
-- Name: uq_invite; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE UNIQUE INDEX uq_invite ON public.club_invitations USING btree (club_id, invited_user_id);


--
-- Name: uq_join_req; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE UNIQUE INDEX uq_join_req ON public.club_join_requests USING btree (club_id, user_id);


--
-- Name: uq_user_club; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE UNIQUE INDEX uq_user_club ON public.user_clubs USING btree (club_id, user_id);


--
-- Name: users_username_lower_idx; Type: INDEX; Schema: public; Owner: leolopez-linquet
--

CREATE UNIQUE INDEX users_username_lower_idx ON public.users USING btree (lower(username));


--
-- Name: messages update_conversation_timestamp_trigger; Type: TRIGGER; Schema: public; Owner: leolopez-linquet
--

CREATE TRIGGER update_conversation_timestamp_trigger AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();


--
-- Name: bookings bookings_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_court_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_court_id_fkey FOREIGN KEY (court_id) REFERENCES public.courts(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: courts courts_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.courts
    ADD CONSTRAINT courts_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: looking looking_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.looking
    ADD CONSTRAINT looking_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;


--
-- Name: matches matches_p1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_p1_id_fkey FOREIGN KEY (p1_id) REFERENCES public.players(id);


--
-- Name: matches matches_p2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_p2_id_fkey FOREIGN KEY (p2_id) REFERENCES public.players(id);


--
-- Name: matches matches_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: matches matches_winner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.players(id);


--
-- Name: message_reads message_reads_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: standings standings_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.standings
    ADD CONSTRAINT standings_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: standings standings_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.standings
    ADD CONSTRAINT standings_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;


--
-- Name: tournament_players tournament_players_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_players
    ADD CONSTRAINT tournament_players_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;


--
-- Name: tournament_players tournament_players_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_players
    ADD CONSTRAINT tournament_players_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: tournament_points tournament_points_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_points
    ADD CONSTRAINT tournament_points_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;


--
-- Name: tournament_points tournament_points_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournament_points
    ADD CONSTRAINT tournament_points_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: tournaments tournaments_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: user_announcements user_announcements_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.user_announcements
    ADD CONSTRAINT user_announcements_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;


--
-- Name: users users_active_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: leolopez-linquet
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_active_club_id_fkey FOREIGN KEY (active_club_id) REFERENCES public.clubs(id);


--
-- Name: TABLE feedback; Type: ACL; Schema: public; Owner: leolopez-linquet
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.feedback TO PUBLIC;


--
-- Name: SEQUENCE feedback_id_seq; Type: ACL; Schema: public; Owner: leolopez-linquet
--

GRANT SELECT,USAGE ON SEQUENCE public.feedback_id_seq TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict csmekWAA2lUj3uvstYZjUJyqmsvIderb0iIwpHac73NKUTyVfLpAbonrjtxv3zX

