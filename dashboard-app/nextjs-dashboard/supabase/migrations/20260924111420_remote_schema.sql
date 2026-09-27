CREATE TABLE "public"."customers" (
  "id"        uuid                   NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "name"      character varying(255) NOT NULL,
  "email"     character varying(255) NOT NULL,
  "image_url" character varying(255) NOT NULL,
  CONSTRAINT "customers_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."invoices" (
  "id"          uuid                   NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "customer_id" uuid                   NOT NULL,
  "amount"      integer                NOT NULL,
  "status"      character varying(255) NOT NULL,
  "date"        date                   NOT NULL,
  "description" text,
  CONSTRAINT "invoices_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."revenue" (
  "month"   character varying(4) NOT NULL,
  "revenue" integer              NOT NULL,
  CONSTRAINT "revenue_month_key" UNIQUE (month)
);

CREATE TABLE "public"."users" (
  "id"       uuid                   NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "name"     character varying(255) NOT NULL,
  "email"    text                   NOT NULL,
  "password" text                   NOT NULL,
  CONSTRAINT "users_email_key" UNIQUE (email),
  CONSTRAINT "users_pkey" PRIMARY KEY (id)
);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."customers" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."invoices" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."revenue" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "anon", "authenticated", "postgres", "service_role";

