.PHONY: up down migrate seed test

up:
	docker-compose up -d

down:
	docker-compose down

migrate:
	docker-compose exec api go run db/migrations/run.go

seed:
	docker-compose exec api go run db/seed/seed.go

test:
	docker-compose exec api go test ./... -v
